import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

import { injectPrecache } from '../scripts/inject-sw-precache.mjs'

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const origin = 'https://example.test'
const requestKey = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href

function createNetwork() {
  return {
    stores: new Map(), calls: [], options: [], routes: new Map(),
    version: 'first', offline: false, status: 200, quotaFull: false,
    openFails: false, matchFails: false,
  }
}

function createWorker(network, assets = ['/assets/app-first.js']) {
  const events = new Map()
  const fetch = async (request, options) => {
    network.calls.push(requestKey(request))
    network.options.push(options)
    if (network.offline) throw new Error('Offline')
    const route = network.routes.get(new URL(requestKey(request)).pathname) || {}
    if (route.pending) await route.pending
    if (route.error) throw route.error
    const response = new Response(route.body ?? network.version, { status: route.status ?? network.status })
    Object.defineProperty(response, 'type', { value: route.type ?? 'basic' })
    return response
  }
  const caches = {
    async open(name) {
      if (network.openFails) throw new Error('CacheStorage unavailable')
      if (!network.stores.has(name)) network.stores.set(name, new Map())
      const store = network.stores.get(name)
      return {
        async match(request) {
          if (network.matchFails) throw new Error('Cache read failed')
          return store.get(requestKey(request))?.clone()
        },
        async put(request, response) {
          if (network.quotaFull) throw new Error('QuotaExceededError')
          store.set(requestKey(request), response.clone())
        },
        async addAll(requests) {
          const responses = await Promise.all(requests.map((request) => fetch(request)))
          if (responses.some((response) => !response.ok || response.status === 206)) {
            throw new TypeError('Precache request failed')
          }
          if (network.quotaFull) throw new Error('QuotaExceededError')
          requests.forEach((request, index) => store.set(requestKey(request), responses[index]))
        },
      }
    },
    async keys() { return [...network.stores.keys()] },
    async delete(name) { return network.stores.delete(name) },
  }
  const context = vm.createContext({
    caches, fetch, URL, Response,
    self: {
      location: { origin },
      clients: { claim: async () => {} },
      addEventListener: (type, handler) => events.set(type, handler),
      skipWaiting: () => { throw new Error('Must not replace the worker serving an open tab') },
    },
  })
  vm.runInContext(injectPrecache(source, assets), context)
  const worker = {
    async lifecycle(type) {
      let promise
      events.get(type)({ waitUntil(value) { promise = value } })
      await promise
    },
    beginRequest(path, options = {}) {
      let promise
      let active = true
      const background = []
      events.get('fetch')({
        request: {
          url: new URL(path, origin).href, method: 'GET', mode: 'cors', destination: '',
          headers: new Headers(), ...options,
        },
        respondWith(value) { promise = value },
        waitUntil(value) {
          assert.ok(active, 'background work must be registered during the fetch event')
          background.push(value)
        },
      })
      active = false
      return { response: Promise.resolve(promise), done: Promise.all(background), handled: promise !== undefined }
    },
    async request(path, mode = 'cors') {
      const event = worker.beginRequest(path, { mode })
      const response = await event.response
      await event.done
      return response
    },
  }
  return worker
}

test('cache version is stable for one build and changes with its code or asset hashes', () => {
  assert.equal(injectPrecache(source, ['b', 'a']), injectPrecache(source, ['a', 'b']))
  assert.notEqual(injectPrecache(source, ['a']), injectPrecache(source, ['b']))
  assert.notEqual(injectPrecache(source, ['a']), injectPrecache(`${source}\n// change`, ['a']))
  assert.doesNotMatch(injectPrecache(source, ['a']), /__BUILD_ID__/)
})

test('cached images return while their network refresh is still pending, then update for offline use', async () => {
  const network = createNetwork()
  const worker = createWorker(network)
  const path = '/images/product.webp'
  assert.equal(await (await worker.request(path)).text(), 'first')
  let release
  network.routes.set(path, {
    body: 'updated image',
    pending: new Promise((resolve) => { release = resolve }),
  })
  const event = worker.beginRequest(path)
  const pending = Symbol('network still pending')
  const result = await Promise.race([event.response, new Promise((resolve) => setImmediate(() => resolve(pending)))])
  release()
  await event.done
  assert.notEqual(result, pending, 'a cached image must not wait for the network')
  assert.equal(await result.text(), 'first')
  assert.equal(network.options.at(-1)?.cache, 'no-cache', 'background refresh must revalidate the HTTP cache too')
  network.offline = true
  assert.equal(await (await worker.request(path)).text(), 'updated image')
  assert.equal(network.calls.length, 3)
})

test('voice SDK and worklets are fetched on demand instead of during service worker installation', async () => {
  const network = createNetwork()
  const voicePaths = ['voice-assistant-sdk', 'rawAudioProcessor', 'audioConcatProcessor'].map((name) => `/assets/${name}-test.js`)
  const worker = createWorker(network, ['/assets/app-first.js', ...voicePaths])
  await worker.lifecycle('install')
  for (const voicePath of voicePaths) {
    assert.ok(!network.calls.includes(requestKey(voicePath)))
    assert.equal(await (await worker.request(voicePath)).text(), 'first')
    assert.ok(network.calls.includes(requestKey(voicePath)))
  }
})

test('constructor code, metadata and CSS remain on demand while shared storefront dependencies are precached', async () => {
  const network = createNetwork()
  const editorPaths = ['/assets/constructor-editor-hash.js', '/assets/constructor-data-hash.js', '/assets/constructor-editor-hash.css']
  const sharedPaths = ['/assets/vendor-vue-hash.js', '/assets/catalog-data-hash.js', '/assets/index-hash.css']
  const worker = createWorker(network, ['/assets/app-first.js', ...editorPaths, ...sharedPaths])
  await worker.lifecycle('install')
  for (const path of editorPaths) assert.ok(!network.calls.includes(requestKey(path)), path)
  for (const path of sharedPaths) assert.ok(network.calls.includes(requestKey(path)), path)
  for (const path of editorPaths) {
    assert.equal(await (await worker.request(path)).text(), 'first')
    const count = network.calls.length
    assert.equal(await (await worker.request(path)).text(), 'first')
    assert.equal(network.calls.length, count, 'After opening the editor its hashed files use the runtime cache')
  }
})

test('hashed chunks use their cache, and a new release cleans only owned caches', async () => {
  const network = createNetwork()
  network.stores.set('unrelated-application', new Map())
  const first = createWorker(network)
  await first.lifecycle('install')
  await first.lifecycle('activate')
  const requestsAfterInstall = network.calls.length
  assert.equal(await (await first.request('/assets/app-first.js')).text(), 'first')
  assert.equal(network.calls.length, requestsAfterInstall)
  network.version = 'second'
  const second = createWorker(network, ['/assets/app-second.js'])
  await second.lifecycle('install')
  assert.equal(network.stores.size, 3, 'waiting release leaves the active release cache intact')
  await second.lifecycle('activate')
  assert.equal(network.stores.size, 2)
  assert.ok(network.stores.has('unrelated-application'))
  network.offline = true
  assert.equal(await (await second.request('/assets/app-second.js')).text(), 'second')
  assert.equal(await (await second.request('/catalog', 'navigate')).text(), 'second')
})

test('failed or partial image refreshes never overwrite an existing complete image', async () => {
  const network = createNetwork()
  const worker = createWorker(network)
  await worker.request('/images/product.webp')
  for (const status of [404, 500, 206]) {
    network.status = status
    network.version = 'invalid image'
    assert.equal(await (await worker.request('/images/product.webp')).text(), 'first')
    assert.equal((await worker.request(`/missing-${status}.webp`)).status, status)
  }
  network.offline = true
  assert.equal(await (await worker.request('/images/product.webp')).text(), 'first')
  for (const status of [404, 500, 206]) {
    assert.equal((await worker.request(`/missing-${status}.webp`)).type, 'error')
  }
})

test('CacheStorage open, read and quota errors never hide successful network responses', async () => {
  for (const failure of ['openFails', 'matchFails', 'quotaFull']) {
    const network = createNetwork()
    const worker = createWorker(network)
    network[failure] = true
    for (const path of ['/images/new.webp', '/assets/new-123.js', '/page.html']) {
      assert.equal(await (await worker.request(path)).text(), 'first', `${failure}: ${path}`)
    }
    network.offline = true
    assert.equal((await worker.request('/images/absent.webp')).type, 'error')
    assert.equal((await worker.request('/page.html')).type, 'error')
  }
})

test('HTML stays network-first, while unrelated API, audio, cross-origin and non-GET requests bypass the worker', async () => {
  const network = createNetwork()
  const worker = createWorker(network)
  await worker.request('/page.html')
  network.version = 'updated page'
  assert.equal(await (await worker.request('/page.html')).text(), 'updated page')
  const html = worker.beginRequest('/fragment', { headers: new Headers({ accept: 'text/html' }) })
  assert.equal(await (await html.response).text(), 'updated page')
  await html.done
  network.offline = true
  assert.equal(await (await worker.request('/page.html')).text(), 'updated page')
  const bypasses = [
    ['/api/catalog'], ['/audio/sample.mp3'], ['/script.js'],
    ['https://cdn.example.test/image.webp'], ['/images/product.webp', { method: 'POST' }],
  ]
  const calls = network.calls.length
  for (const [path, options] of bypasses) assert.equal(worker.beginRequest(path, options).handled, false)
  assert.equal(network.calls.length, calls)
})

test('extensionless image requests and the manifest use stale-while-revalidate', async () => {
  const network = createNetwork()
  const worker = createWorker(network)
  for (const [path, options] of [
    ['/image-endpoint?id=1', { destination: 'image' }], ['/manifest.webmanifest', {}],
  ]) {
    network.version = 'first'
    let event = worker.beginRequest(path, options)
    assert.equal(await (await event.response).text(), 'first')
    await event.done
    network.version = 'updated'
    event = worker.beginRequest(path, options)
    assert.equal(await (await event.response).text(), 'first')
    await event.done
    network.offline = true
    event = worker.beginRequest(path, options)
    assert.equal(await (await event.response).text(), 'updated')
    await event.done
    network.offline = false
  }
})

test('an optional icon or manifest failure does not block an otherwise complete offline shell', async () => {
  const network = createNetwork()
  network.routes.set('/icons/pwa-512.png', { status: 404 })
  network.routes.set('/manifest.webmanifest', { error: new Error('Optional download failed') })
  const worker = createWorker(network)
  await worker.lifecycle('install')
  await worker.lifecycle('activate')
  network.offline = true
  assert.equal(await (await worker.request('/catalog', 'navigate')).text(), 'first')
  assert.equal(await (await worker.request('/assets/app-first.js')).text(), 'first')
  assert.equal(await (await worker.request('/icons/pwa-192.png')).text(), 'first')
  assert.equal((await worker.request('/icons/pwa-512.png')).type, 'error')
})

test('missing required HTML or chunks reject installation and leave the active release usable', async () => {
  for (const path of ['/', '/index.html', '/assets/app-second.js', '/assets/style-second.css']) {
    const network = createNetwork()
    const first = createWorker(network)
    await first.lifecycle('install')
    await first.lifecycle('activate')
    network.version = 'second'
    network.routes.set(path, { status: 404 })
    const second = createWorker(network, ['/assets/app-second.js', '/assets/style-second.css'])
    await assert.rejects(second.lifecycle('install'), /Precache request failed/)
    network.offline = true
    assert.equal(await (await first.request('/catalog', 'navigate')).text(), 'first')
    assert.equal(await (await first.request('/assets/app-first.js')).text(), 'first')
  }
})

test('required precache storage failures reject installation instead of accepting a broken offline shell', async () => {
  for (const failure of ['openFails', 'quotaFull']) {
    const network = createNetwork()
    network[failure] = true
    await assert.rejects(createWorker(network).lifecycle('install'), /CacheStorage unavailable|QuotaExceededError/)
  }
})
