import { test, expect } from '@playwright/test'

test('unknown routes send HTTP 404 with noindex instead of the homepage', async ({ request }) => {
  for (const path of ['/does-not-exist', '/product/no-such-product', '/catalog/no-such-category']) {
    const response = await request.get(path)
    expect(response.status()).toBe(404)
    expect(await response.text()).toContain('noindex, nofollow')
  }
})

test('legacy entry points redirect while preserving query parameters', async ({ request }) => {
  for (const [source, destination] of [['/cart', '/catalog'], ['/checkout/', '/contacts'], ['/wishlist', '/catalog']]) {
    const response = await request.get(`${source}?utm_source=test`, { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers().location).toBe(`${destination}?utm_source=test`)
  }
})

test('hashed assets receive immutable cache headers', async ({ request }) => {
  const home = await request.get('/')
  const html = await home.text()
  const asset = html.match(/src="(\/assets\/index-[^"]+\.js)"/)[1]
  const response = await request.get(asset)
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('immutable')
})
