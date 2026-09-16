import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'

import { expect, test } from '@playwright/test'

import { injectPrecache } from '../scripts/inject-sw-precache.mjs'

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
let site

test.beforeEach(async () => {
  const state = { version: 'first', imageVersion: 'first', holdImage: false, pending: [], calls: [] }
  const sendImage = (response) => {
    response.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
      ETag: `"${state.imageVersion}"`,
    })
    response.end(`<svg xmlns="http://www.w3.org/2000/svg"><title>${state.imageVersion}</title></svg>`)
  }
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname
    state.calls.push(path)
    if (path === '/sw.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' })
      response.end(injectPrecache(source, [`/assets/shell-${state.version}.js`]))
    } else if (path === '/' || path === '/index.html' || path === '/probe') {
      response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
      response.end(`<!doctype html><html><body><h1>${state.version} offline shell</h1></body></html>`)
    } else if (path.startsWith('/assets/') && path !== state.missingAsset) {
      response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'public, max-age=31536000, immutable' })
      response.end(`/* ${state.version} hashed chunk */`)
    } else if (path === '/images/product.svg') {
      if (state.holdImage) state.pending.push(response)
      else sendImage(response)
    } else {
      // Optional manifest/icons intentionally fail; they must not break installation.
      response.writeHead(404, { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' })
      response.end('Missing optional asset')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  site = {
    state,
    url: `http://127.0.0.1:${server.address().port}`,
    releaseImage() {
      state.holdImage = false
      for (const response of state.pending.splice(0)) sendImage(response)
    },
    async close() {
      server.closeAllConnections()
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    },
  }
})

test.afterEach(async () => {
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('fixture-requests', { body: JSON.stringify(site.state.calls), contentType: 'application/json' })
  }
  await site.close()
})

async function installWorker(page) {
  await page.goto(`${site.url}/probe`)
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js').then(() => undefined))
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    return { controlled: !!navigator.serviceWorker.controller, state: registration?.active?.state ?? registration?.installing?.state }
  }), { message: 'The required shell should install even when optional icons return 404' }).toEqual({ controlled: true, state: 'activated' })
}

test('a real service worker serves cached images before refresh completes and keeps the refresh offline', async ({ page, context }) => {
  await installWorker(page)
  expect(await page.evaluate(() => fetch('/images/product.svg').then((response) => response.text()))).toContain('first')
  await expect.poll(() => page.evaluate(async () => (await caches.match('/images/product.svg'))?.text())).toContain('first')

  site.state.imageVersion = 'updated'
  site.state.holdImage = true
  const staleResponse = page.evaluate(() => fetch('/images/product.svg').then((response) => response.text()))
  await expect.poll(() => site.state.pending.length).toBe(1)
  // The network response is deliberately held open until this cached response arrives.
  expect(await staleResponse).toContain('first')
  site.releaseImage()
  await expect.poll(() => page.evaluate(async () => (await caches.match('/images/product.svg'))?.text())).toContain('updated')
  expect(site.state.calls.filter((path) => path === '/images/product.svg')).toHaveLength(2)

  const requestsBeforeChunk = site.state.calls.length
  expect(await page.evaluate(() => fetch('/assets/shell-first.js').then((response) => response.text()))).toContain('first')
  expect(site.state.calls).toHaveLength(requestsBeforeChunk)

  await context.setOffline(true)
  expect(await page.evaluate(() => fetch('/images/product.svg').then((response) => response.text()))).toContain('updated')
  await page.goto(`${site.url}/unvisited-route`)
  await expect(page.getByRole('heading')).toHaveText('first offline shell')
})

test('a failed required chunk rejects a real worker upgrade and preserves the previous offline release', async ({ page, context }) => {
  await installWorker(page)
  site.state.version = 'second'
  site.state.missingAsset = '/assets/shell-second.js'
  const update = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    const original = registration.active
    const finished = new Promise((resolve) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker.addEventListener('statechange', () => {
          if (worker.state === 'redundant' || worker.state === 'installed') resolve(worker.state)
        })
      }, { once: true })
    })
    await registration.update()
    return { state: await finished, previousStillActive: registration.active === original }
  })
  expect(update).toEqual({ state: 'redundant', previousStillActive: true })
  await context.setOffline(true)
  expect(await page.evaluate(() => fetch('/assets/shell-first.js').then((response) => response.text()))).toContain('first')
  await page.goto(`${site.url}/unvisited-route`)
  await expect(page.getByRole('heading')).toHaveText('first offline shell')
})
