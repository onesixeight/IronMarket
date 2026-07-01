#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'

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
  return new Promise((resolveInstall, rejectInstall) => {
    const child = spawn(process.execPath, [playwrightCli, 'install', 'chromium'], {
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
