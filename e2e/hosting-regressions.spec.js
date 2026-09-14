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

test('trailing slash URLs permanently redirect to a working canonical page', async ({ request }) => {
  const query = '?product=6149&utm_source=google&note=a%2Fb'
  for (const canonical of ['/catalog', '/contacts', '/about', '/delivery', '/thank-you', '/catalog/kovanye-balyasiny', '/product/6150']) {
    const response = await request.get(`${canonical}/${query}`, { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers().location).toBe(`${canonical}${query}`)
    const destination = await request.get(response.headers().location, { maxRedirects: 0 })
    expect(destination.status()).toBe(200)
    expect(await destination.text()).toContain(`href="https://etalon-kovka.kz${canonical}"`)
  }
})
