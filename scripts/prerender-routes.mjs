#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'

import { buildSiteRoutes } from './site-routes.mjs'
import { getChromiumLaunchOptions } from './chromium-runtime.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(projectRoot, 'dist')
const viteBin = resolve(projectRoot, 'node_modules/vite/bin/vite.js')
const host = '127.0.0.1'
const renderTimeoutMs = 20000
const concurrency = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY || 4))
let currentStage = 'starting'
let firstPageStarted = false
const activeRoutes = new Map()

function logStage(stage) {
  currentStage = stage
  console.log(`[prerender] ${stage}`)
}

export function buildPrerenderRoutes() {
  // Operational/error pages need direct HTTP entry points, but stay out of the sitemap.
  return [...buildSiteRoutes(), { path: '/thank-you' }, { path: '/404' }]
}

export function routeOutputPath(routePath) {
  if (routePath === '/404') return resolve(distDir, '404.html')
  const normalizedPath = routePath === '/' ? '' : String(routePath).replace(/^\/+|\/+$/g, '')
  return resolve(distDir, normalizedPath, 'index.html')
}

export function preparePrerenderDocument(routePath) {
  // The page already contains its content. A JS-controlled overlay must not hide it.
  document.getElementById('preloader')?.remove()
  for (const element of document.querySelectorAll('.reveal-pending')) {
    element.classList.remove('reveal-pending', 'reveal-visible')
    for (const className of [...element.classList]) {
      if (className.startsWith('reveal-delay-')) element.classList.remove(className)
    }
  }

  for (const preload of document.querySelectorAll('link[rel="preload"][as="image"]')) {
    preload.remove()
  }
  if (routePath !== '/') return

  const hero = document.querySelector('main img[fetchpriority="high"]')
  if (!hero) throw new Error('Home prerender is missing its high-priority hero image.')
  const preload = document.createElement('link')
  preload.rel = 'preload'
  preload.as = 'image'
  preload.setAttribute('fetchpriority', 'high')
  preload.setAttribute('imagesizes', hero.getAttribute('sizes') || '100vw')
  if (hero.getAttribute('srcset')) preload.setAttribute('imagesrcset', hero.getAttribute('srcset'))
  preload.setAttribute('href', hero.getAttribute('src'))
  document.head.appendChild(preload)
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
  const isFirstPage = !firstPageStarted
  firstPageStarted = true
  if (isFirstPage) logStage('first newPage: start')
  const page = await context.newPage()
  if (isFirstPage) logStage('first newPage: done')
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
  activeRoutes.set(route.path, 'newPage')
  const page = await createPage(context, origin)
  const url = new URL(route.path, origin).href

  try {
    activeRoutes.set(route.path, 'goto')
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: renderTimeoutMs })
    activeRoutes.set(route.path, 'waitForApp')
    await page.waitForFunction(
      () => {
        const app = document.querySelector('#app')
        return Boolean(app?.textContent?.trim() && document.querySelector('#app main'))
      },
      null,
      { timeout: renderTimeoutMs }
    )
    await page.waitForTimeout(100)
    activeRoutes.set(route.path, 'prepareDocument')
    await page.evaluate(preparePrerenderDocument, route.path)

    activeRoutes.set(route.path, 'content')
    return {
      path: route.path,
      html: await page.content(),
    }
  } catch (error) {
    console.error(`[prerender] ${route.path} failed at ${activeRoutes.get(route.path)}: ${error.message}`)
    throw error
  } finally {
    activeRoutes.set(route.path, 'page.close')
    await page.close()
    activeRoutes.delete(route.path)
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
  logStage(`launch: start (${routes.length} routes, concurrency ${concurrency})`)
  const browser = await chromium.launch(await getChromiumLaunchOptions())
  logStage('launch: done; newContext: start')
  const context = await browser.newContext({ locale: 'ru-RU' })
  logStage('newContext: done')
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
      if (renderedRoutes.length % 25 === 0 || renderedRoutes.length === routes.length) {
        logStage(`rendered ${renderedRoutes.length}/${routes.length}; last ${route.path}`)
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, routes.length) }, worker))
  } finally {
    logStage('context.close: start')
    await context.close()
    logStage('context.close: done; browser.close: start')
    await browser.close()
    logStage('browser.close: done')
  }

  return renderedRoutes
}

export async function prerender() {
  const port = await getFreePort()
  const origin = `http://${host}:${port}`
  const preview = startPreview(port)

  try {
    await waitForPreview(origin, preview)
    const routes = buildPrerenderRoutes()
    const renderedRoutes = await renderRoutes(origin, routes)
    logStage('writing rendered HTML')
    await writeRenderedRoutes(renderedRoutes)
    console.log(`Prerendered ${renderedRoutes.length} routes into dist`)
  } finally {
    preview.kill('SIGTERM')
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  const deadline = setTimeout(() => {
    console.error(`[prerender] Timed out after 8 minutes. Last stage: ${currentStage}. Active routes: ${JSON.stringify(Object.fromEntries(activeRoutes))}`)
    process.exit(1)
  }, 8 * 60 * 1000)
  prerender().catch((error) => {
    console.error(error)
    process.exit(1)
  }).finally(() => clearTimeout(deadline))
}
