const CACHE_PREFIX = 'etalon-pwa-'
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`
const PRECACHE_ASSETS = []
const APP_SHELL = ['/', '/index.html']
const OPTIONAL_ASSETS = [
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
  '/icons/apple-touch-icon.png',
]
const PRECACHE_URLS = [...new Set([...APP_SHELL, ...PRECACHE_ASSETS])]

function shouldCacheResponse(response) {
  return response && response.status === 200 && response.type === 'basic'
}

async function putInCache(request, response) {
  if (!shouldCacheResponse(response)) return

  try {
    const copy = response.clone()
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, copy)
  } catch {
    // Runtime caching is optional when storage is unavailable or its quota is full.
  }
}

async function matchCache(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    return await cache.match(request)
  } catch {
    return undefined
  }
}

async function cacheFirst(request) {
  const cachedResponse = await matchCache(request)
  if (cachedResponse) return cachedResponse

  try {
    const networkResponse = await fetch(request)
    await putInCache(request, networkResponse)
    return networkResponse
  } catch {
    return Response.error()
  }
}

async function networkFirst(request, fallbackUrl) {
  try {
    const networkResponse = await fetch(request, { cache: 'no-cache' })
    await putInCache(request, networkResponse)
    return networkResponse
  } catch {
    return (await matchCache(request)) || (fallbackUrl ? await matchCache(fallbackUrl) : null) || Response.error()
  }
}

function staleWhileRevalidate(event) {
  const { request } = event
  const cachedResponse = matchCache(request)
  // Revalidate the HTTP cache too, so an unchanged image URL can receive new content.
  const networkResponse = fetch(request, { cache: 'no-cache' }).catch(() => null)
  // Register synchronously: the worker must survive after it returns a cached image.
  event.waitUntil(networkResponse.then((response) => putInCache(request, response)))
  return cachedResponse.then(async (cached) => cached || (await networkResponse) || Response.error())
}

function isVersionedAsset(url) {
  return /^\/assets\/.+-[\w-]+\.(?:js|css)$/.test(url.pathname)
}

function isHtmlRequest(request, url) {
  return request.destination === 'document' || /\.html?$/i.test(url.pathname) ||
    request.headers.get('accept')?.includes('text/html')
}

function isImageRequest(request, url) {
  return request.destination === 'image' || /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Reject installation if any required HTML, JS or CSS cannot be cached.
      // The browser keeps the previous active worker and its complete offline shell.
      await cache.addAll(PRECACHE_URLS)
      await Promise.allSettled(OPTIONAL_ASSETS.map(async (url) => {
        const response = await fetch(url)
        if (shouldCacheResponse(response)) await putInCache(url, response)
        else await response.body?.cancel()
      }))
    }),
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

  if (isHtmlRequest(request, url)) {
    event.respondWith(networkFirst(request))
    return
  }

  if (isVersionedAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (isImageRequest(request, url) || url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(event))
  }
  // Leave API calls, audio and other on-demand requests to the browser network stack.
})
