#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'

import { buildSiteRoutes } from './site-routes.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(projectRoot, 'dist')
const viteBin = resolve(projectRoot, 'node_modules/vite/bin/vite.js')
const host = '127.0.0.1'
const renderTimeoutMs = 20000
const concurrency = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY || 4))

export function routeOutputPath(routePath) {
  const normalizedPath = routePath === '/' ? '' : String(routePath).replace(/^\/+|\/+$/g, '')
  return resolve(distDir, normalizedPath, 'index.html')
}

async function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(() => resolvePort(address.port))
    })
  })
}

async function waitForPreview(origin, child) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < renderTimeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`vite preview exited early with code ${child.exitCode}`)
    }

    try {
      const response = await fetch(origin, { cache: 'no-store' })
      if (response.ok) return
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 200))
    }
  }

  throw new Error('Timed out waiting for vite preview to start.')
}

function startPreview(port) {
  return spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    cwd: projectRoot,
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

async function createPage(context, origin) {
  const page = await context.newPage()
  await page.route('**/*', (route) => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.origin !== origin) {
      return route.abort()
    }
    return route.continue()
  })
  return page
}

async function renderRoute(context, origin, route) {
  const page = await createPage(context, origin)
  const url = new URL(route.path, origin).href

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: renderTimeoutMs })
    await page.waitForFunction(
      () => {
        const app = document.querySelector('#app')
        return Boolean(app?.textContent?.trim() && document.querySelector('#app main'))
      },
      null,
      { timeout: renderTimeoutMs }
    )
    await page.waitForTimeout(100)

    return {
      path: route.path,
      html: await page.content(),
    }
  } finally {
    await page.close()
  }
}

async function writeRenderedRoutes(renderedRoutes) {
  for (const route of renderedRoutes) {
    const outputPath = routeOutputPath(route.path)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, route.html, 'utf8')
  }
}

async function renderRoutes(origin, routes) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ locale: 'ru-RU' })
  await context.addInitScript(() => {
    window.localStorage.setItem('cookie-consent', 'declined')
    window.localStorage.removeItem('recently-viewed')
  })

  const renderedRoutes = []
  let cursor = 0

  async function worker() {
    while (cursor < routes.length) {
      const route = routes[cursor]
      cursor += 1
      renderedRoutes.push(await renderRoute(context, origin, route))
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, routes.length) }, worker))
  } finally {
    await context.close()
    await browser.close()
  }

  return renderedRoutes
}

export async function prerender() {
  const port = await getFreePort()
  const origin = `http://${host}:${port}`
  const preview = startPreview(port)

  try {
    await waitForPreview(origin, preview)
    const routes = buildSiteRoutes()
    const renderedRoutes = await renderRoutes(origin, routes)
    await writeRenderedRoutes(renderedRoutes)
    console.log(`Prerendered ${renderedRoutes.length} routes into dist`)
  } finally {
    preview.kill('SIGTERM')
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  prerender().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
