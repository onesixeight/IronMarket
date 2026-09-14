import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const variants = JSON.parse(readFileSync(new URL('../src/data/image-variants.json', import.meta.url), 'utf8'))
const exampleUrls = Object.entries(variants)
  .filter(([original]) => original.startsWith('/images/examples/'))
  .flatMap(([, srcset]) => srcset.split(', ').map(candidate => candidate.split(' ')[0]))

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, serviceWorkers: 'block' })

test('mobile home defers examples until scrolling and requests one responsive hero', async ({ page }) => {
  const requested = []
  page.on('request', request => requested.push(new URL(request.url()).pathname))
  await page.goto('/')
  await expect(page.getByTestId('header-search-button')).toBeVisible()
  await expect(page.locator('img[fetchpriority="high"]')).toHaveJSProperty('complete', true)
  // Fonts have completed as part of load; only three distinct variable-font URLs are needed.
  expect(new Set(requested.filter(url => url.startsWith('/fonts/'))).size).toBeLessThanOrEqual(3)
  expect(requested.filter(url => url.includes('hero-ornamental-pattern-v2'))).toHaveLength(1)
  expect(requested.filter(url => exampleUrls.includes(url))).toHaveLength(0)

  await page.getByTestId('cookie-decline').click()
  const example = page.locator('.example-card img').first()
  await example.scrollIntoViewIfNeeded()
  await expect.poll(() => example.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true)
  expect(await example.evaluate(img => img.currentSrc)).toContain('/images/optimized/')
})

test('direct product load excludes home preload and displays an optimized image', async ({ page }) => {
  const requested = []
  page.on('request', request => requested.push(new URL(request.url()).pathname))
  await page.goto('/product/6149')
  const productImage = page.getByTestId('product-detail-image')
  await expect.poll(() => productImage.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true)
  expect(requested.filter(url => url.startsWith('/images/hero/'))).toHaveLength(0)
  expect(await productImage.evaluate(img => img.currentSrc)).toContain('/images/optimized/')
})

test('prerendered product content remains visible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/product/6149`)
    await expect(page.locator('h1')).toContainText('Астана')
    await expect(page.locator('#preloader')).toHaveCount(0)
    const cover = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#preloader'))
    expect(cover).toBeNull()
  } finally {
    await context.close()
  }
})
