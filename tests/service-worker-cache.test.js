import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

import { injectPrecache } from '../scripts/inject-sw-precache.mjs'

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const origin = 'https://example.test'
const requestKey = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href

function createNetwork() {
  return { stores: new Map(), calls: [], version: 'first', offline: false, status: 200, quotaFull: false }
}

function createWorker(network, assets = ['/assets/app-first.js']) {
  const events = new Map()
  const fetch = async (request) => {
    network.calls.push(requestKey(request))
    if (network.offline) throw new Error('Offline')
    const response = new Response(network.version, { status: network.status })
    Object.defineProperty(response, 'type', { value: 'basic' })
    return response
  }
  const caches = {
    async open(name) {
      if (!network.stores.has(name)) network.stores.set(name, new Map())
      const store = network.stores.get(name)
      return {
        async match(request) { return store.get(requestKey(request))?.clone() },
        async put(request, response) {
          if (network.quotaFull) throw new Error('QuotaExceededError')
          store.set(requestKey(request), response.clone())
        },
        async addAll(requests) {
          for (const request of requests) store.set(requestKey(request), await fetch(request))
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
  return {
    async lifecycle(type) {
      let promise
      events.get(type)({ waitUntil(value) { promise = value } })
      await promise
    },
    async request(path, mode = 'cors') {
      let promise
      events.get('fetch')({
        request: { url: new URL(path, origin).href, method: 'GET', mode },
        respondWith(value) { promise = value },
      })
      return promise
    },
  }
}

test('cache version is stable for one build and changes with its code or asset hashes', () => {
  assert.equal(injectPrecache(source, ['b', 'a']), injectPrecache(source, ['a', 'b']))
  assert.notEqual(injectPrecache(source, ['a']), injectPrecache(source, ['b']))
  assert.notEqual(injectPrecache(source, ['a']), injectPrecache(`${source}\n// change`, ['a']))
  assert.doesNotMatch(injectPrecache(source, ['a']), /__BUILD_ID__/)
})

test('unversioned images refresh online and remain available offline', async () => {
  const network = createNetwork()
  const worker = createWorker(network)
  const path = '/images/product.webp'
  assert.equal(await (await worker.request(path)).text(), 'first')
  network.version = 'updated image'
  assert.equal(await (await worker.request(path)).text(), 'updated image')
  network.offline = true
  assert.equal(await (await worker.request(path)).text(), 'updated image')
  assert.equal(network.calls.length, 3)
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

test('404s are not cached and storage failures do not hide successful responses', async () => {
  const network = createNetwork()
  const worker = createWorker(network)
  network.status = 404
  assert.equal((await worker.request('/missing.webp')).status, 404)
  network.offline = true
  assert.equal((await worker.request('/missing.webp')).type, 'error')
  network.offline = false
  network.status = 200
  network.quotaFull = true
  assert.equal(await (await worker.request('/images/new.webp')).text(), 'first')
})
