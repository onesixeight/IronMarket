#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'
import { getChromiumLaunchOptions, isWorkersBuild } from './chromium-runtime.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const playwrightCli = resolve(projectRoot, 'node_modules/playwright/cli.js')

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function runPlaywrightInstall() {
  const installArgs = ['install']

  if (process.platform === 'linux') {
    installArgs.push('--with-deps')
  }

  installArgs.push('chromium')

  return new Promise((resolveInstall, rejectInstall) => {
    const child = spawn(process.execPath, [playwrightCli, ...installArgs], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    })

    child.once('error', rejectInstall)
    child.once('exit', (code) => {
      if (code === 0) {
        resolveInstall()
        return
      }

      rejectInstall(new Error(`Playwright Chromium install exited with code ${code}`))
    })
  })
}

export async function ensurePlaywrightBrowser() {
  if (isWorkersBuild()) {
    let stage = 'prepare-runtime'
    let deadline
    const runStage = async (name, operation) => {
      stage = name
      console.log(`[portable-smoke] ${name}: start`)
      const result = await operation()
      console.log(`[portable-smoke] ${name}: done`)
      return result
    }
    const smoke = async () => {
      const options = await runStage('prepare-runtime', getChromiumLaunchOptions)
      const browser = await runStage('launch', () => chromium.launch(options))
      const context = await runStage('newContext', () => browser.newContext())
      const page = await runStage('newPage', () => context.newPage())
      await runStage('setContent', () => page.setContent('<main><h1>Portable Chromium smoke</h1></main>'))
      const html = await runStage('content', () => page.content())
      if (!html.includes('Portable Chromium smoke')) throw new Error('Portable Chromium did not render the smoke document.')
      await runStage('page.close', () => page.close())
      await runStage('context.close', () => context.close())
      await runStage('browser.close', () => browser.close())
    }
    try {
      await Promise.race([
        smoke(),
        new Promise((_, reject) => {
          deadline = setTimeout(() => reject(new Error(`Portable Chromium smoke timed out after 60s at ${stage}.`)), 60000)
        }),
      ])
      console.log('Portable Chromium ready for unprivileged Workers Builds.')
    } finally {
      clearTimeout(deadline)
    }
    return
  }

  const executablePath = chromium.executablePath()

  if (await pathExists(executablePath)) {
    console.log(`Playwright Chromium ready: ${executablePath}`)
    return
  }

  console.log('Playwright Chromium is missing. Installing chromium before prerender...')
  await runPlaywrightInstall()
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  ensurePlaywrightBrowser().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
