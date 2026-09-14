const CACHE_PREFIX = 'etalon-pwa-'
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`
const PRECACHE_ASSETS = []
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
  '/icons/apple-touch-icon.png',
]
const PRECACHE_URLS = [...new Set([...APP_SHELL, ...PRECACHE_ASSETS])]

function shouldCacheResponse(response) {
  return response && response.ok && response.type === 'basic'
}

async function putInCache(request, response) {
  if (!shouldCacheResponse(response)) return

  const cache = await caches.open(CACHE_NAME)
  // A full storage quota must not turn a successful network response into a failure.
  await cache.put(request, response.clone()).catch(() => {})
}

async function matchCache(request) {
  const cache = await caches.open(CACHE_NAME)
  return cache.match(request)
}

async function cacheFirst(request) {
  const cachedResponse = await matchCache(request)
  if (cachedResponse) return cachedResponse

  const networkResponse = await fetch(request)
  await putInCache(request, networkResponse)
  return networkResponse
}

async function networkFirst(request, fallbackUrl) {
  try {
    const networkResponse = await fetch(request)
    await putInCache(request, networkResponse)
    return networkResponse
  } catch {
    return (await matchCache(request)) || (fallbackUrl ? await matchCache(fallbackUrl) : null) || Response.error()
  }
}

function isVersionedAsset(url) {
  return /^\/assets\/.+-[\w-]+\.(?:js|css)$/.test(url.pathname)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  // Let existing tabs finish using their release before replacing its cache.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/'))
    return
  }

  if (isVersionedAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(networkFirst(request))
})
