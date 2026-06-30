const CACHE_NAME = 'etalon-pwa-v3'
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
  await cache.put(request, response.clone())
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
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
    return (await caches.match(request)) || (fallbackUrl ? await caches.match(fallbackUrl) : null) || Response.error()
  }
}

function isStaticAsset(request, url) {
  return (
    url.pathname.startsWith('/assets/') ||
    ['font', 'image', 'script', 'style', 'worker'].includes(request.destination)
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
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

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(networkFirst(request))
})
