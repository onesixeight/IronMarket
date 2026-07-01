#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

import { chromium } from '@playwright/test'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(projectRoot, 'dist')
const assetsDir = resolve(distDir, 'assets')
const viteBin = resolve(projectRoot, 'node_modules/vite/bin/vite.js')
const host = '127.0.0.1'
const previewTimeoutMs = 20000

export const PERFORMANCE_BUDGETS = {
  domContentLoadedMs: 2000,
  loadMs: 4000,
  lcpMs: 3000,
  cls: 0.1,
  resourceCount: 45,
  assetGzipKb: {
    appEntryJs: 35,
    globalCss: 20,
    vueVendorJs: 40,
    routerVendorJs: 15,
    homeViewJs: 16,
    totalJs: 130,
    totalCss: 30,
  },
}

function assertCheck(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
  console.log(`ok ${message}`)
}

function formatMs(value) {
  return `${Math.round(value)}ms`
}

function formatKb(value) {
  return `${value.toFixed(2)}KB`
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

function startPreview(port) {
  return spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    cwd: projectRoot,
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

async function stopPreview(child) {
  if (child.exitCode !== null) return

  child.kill('SIGTERM')
  await new Promise((resolveStop) => {
    const timeout = setTimeout(resolveStop, 1000)
    child.once('close', () => {
      clearTimeout(timeout)
      resolveStop()
    })
  })
}

async function waitForPreview(origin, child) {
  const startedAt = Date.now()
  let stderr = ''
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  while (Date.now() - startedAt < previewTimeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`vite preview exited early with code ${child.exitCode}. ${stderr}`.trim())
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

async function collectHomeVitals(origin) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    locale: 'ru-RU',
    viewport: { width: 1365, height: 768 },
  })

  await context.addInitScript(() => {
    window.localStorage.setItem('cookie-consent', 'declined')
    window.__performanceBudget = { lcp: 0, cls: 0 }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        window.__performanceBudget.lcp = lastEntry?.renderTime || lastEntry?.loadTime || lastEntry?.startTime || 0
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      window.__performanceBudget.lcp = 0
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__performanceBudget.cls += entry.value
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
    } catch {
      window.__performanceBudget.cls = 0
    }
  })

  const page = await context.newPage()
  await page.route('**/*', (route) => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.origin !== origin) {
      return route.abort()
    }
    return route.continue()
  })

  try {
    await page.goto(origin, { waitUntil: 'load', timeout: previewTimeoutMs })
    await page.waitForSelector('#app main', { timeout: previewTimeoutMs })
    await page.waitForFunction(() => document.querySelector('img[fetchpriority="high"]')?.complete, null, {
      timeout: previewTimeoutMs,
    })
    await page.waitForTimeout(1500)

    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      const resources = performance
        .getEntriesByType('resource')
        .filter((entry) => new URL(entry.name).origin === location.origin)
      const heroImage = document.querySelector('img[fetchpriority="high"]')

      return {
        domContentLoadedMs: navigation.domContentLoadedEventEnd - navigation.startTime,
        loadMs: navigation.loadEventEnd - navigation.startTime,
        lcpMs: window.__performanceBudget.lcp,
        cls: window.__performanceBudget.cls,
        resourceCount: resources.length,
        jsRequests: resources.filter((entry) => entry.name.endsWith('.js')).length,
        cssRequests: resources.filter((entry) => entry.name.endsWith('.css')).length,
        heroImageComplete: Boolean(heroImage?.complete),
      }
    })
  } finally {
    await context.close()
    await browser.close()
  }
}

async function collectAssetSizes() {
  const files = await readdir(assetsDir)
  const assets = []

  for (const file of files) {
    const buffer = await readFile(resolve(assetsDir, file))
    assets.push({
      name: file,
      rawKb: buffer.length / 1024,
      gzipKb: gzipSync(buffer).length / 1024,
    })
  }

  return assets
}

function findSingleAsset(assets, pattern, label) {
  const matches = assets.filter((asset) => pattern.test(asset.name))
  if (matches.length !== 1) {
    throw new Error(`${label} should match exactly one asset, matched ${matches.length}`)
  }
  return matches[0]
}

function checkAssetBudget(asset, maxKb, label) {
  assertCheck(asset.gzipKb <= maxKb, `${label} gzip ${formatKb(asset.gzipKb)} <= ${formatKb(maxKb)}`)
}

async function verifyAssetBudgets() {
  const assets = await collectAssetSizes()
  const budgets = PERFORMANCE_BUDGETS.assetGzipKb

  checkAssetBudget(findSingleAsset(assets, /^index-[^.]+\.js$/, 'app entry JS'), budgets.appEntryJs, 'app entry JS')
  checkAssetBudget(findSingleAsset(assets, /^index-[^.]+\.css$/, 'global CSS'), budgets.globalCss, 'global CSS')
  checkAssetBudget(findSingleAsset(assets, /^vendor-vue-[^.]+\.js$/, 'Vue vendor JS'), budgets.vueVendorJs, 'Vue vendor JS')
  checkAssetBudget(
    findSingleAsset(assets, /^vendor-router-[^.]+\.js$/, 'router vendor JS'),
    budgets.routerVendorJs,
    'router vendor JS'
  )
  checkAssetBudget(findSingleAsset(assets, /^HomeView-[^.]+\.js$/, 'home route JS'), budgets.homeViewJs, 'home route JS')

  const totalJsGzip = assets.filter((asset) => asset.name.endsWith('.js')).reduce((total, asset) => total + asset.gzipKb, 0)
  const totalCssGzip = assets
    .filter((asset) => asset.name.endsWith('.css'))
    .reduce((total, asset) => total + asset.gzipKb, 0)

  assertCheck(totalJsGzip <= budgets.totalJs, `total JS gzip ${formatKb(totalJsGzip)} <= ${formatKb(budgets.totalJs)}`)
  assertCheck(totalCssGzip <= budgets.totalCss, `total CSS gzip ${formatKb(totalCssGzip)} <= ${formatKb(budgets.totalCss)}`)
}

async function verifyRuntimeBudgets() {
  const port = await getFreePort()
  const origin = `http://${host}:${port}`
  const preview = startPreview(port)

  try {
    await waitForPreview(origin, preview)
    const vitals = await collectHomeVitals(origin)

    assertCheck(vitals.heroImageComplete, 'hero LCP image is loaded')
    assertCheck(
      vitals.domContentLoadedMs <= PERFORMANCE_BUDGETS.domContentLoadedMs,
      `DOMContentLoaded ${formatMs(vitals.domContentLoadedMs)} <= ${formatMs(PERFORMANCE_BUDGETS.domContentLoadedMs)}`
    )
    assertCheck(vitals.loadMs <= PERFORMANCE_BUDGETS.loadMs, `load ${formatMs(vitals.loadMs)} <= ${formatMs(PERFORMANCE_BUDGETS.loadMs)}`)
    assertCheck(vitals.lcpMs > 0, 'LCP metric was collected')
    assertCheck(vitals.lcpMs <= PERFORMANCE_BUDGETS.lcpMs, `LCP ${formatMs(vitals.lcpMs)} <= ${formatMs(PERFORMANCE_BUDGETS.lcpMs)}`)
    assertCheck(vitals.cls <= PERFORMANCE_BUDGETS.cls, `CLS ${vitals.cls.toFixed(3)} <= ${PERFORMANCE_BUDGETS.cls}`)
    assertCheck(
      vitals.resourceCount <= PERFORMANCE_BUDGETS.resourceCount,
      `home resource count ${vitals.resourceCount} <= ${PERFORMANCE_BUDGETS.resourceCount}`
    )
    console.log(`ok home page requested ${vitals.jsRequests} JS and ${vitals.cssRequests} CSS assets`)
  } finally {
    await stopPreview(preview)
  }
}

export async function verifyPerformanceBudget() {
  await verifyAssetBudgets()
  await verifyRuntimeBudgets()
  console.log('Performance budget verification passed.')
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  verifyPerformanceBudget().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
