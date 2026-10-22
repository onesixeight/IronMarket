import { expect, test } from '@playwright/test'
import catalog from '../src/data/catalog.json' with { type: 'json' }
import { toSiteUrl } from '../src/config/site.js'

const category = catalog.categories.find((item) => catalog.products.filter((p) => p.categorySlug === item.slug).length > 20)

function inspectListing(source) {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  return {
    title: doc.title,
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    products: [...new Set([...doc.querySelectorAll('main a[href^="/product/"]')].map((a) => a.getAttribute('href')))],
    next: doc.querySelector('a[aria-label="Следующая страница"]')?.getAttribute('href'),
    list: [...doc.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent)).find((schema) => schema['@type'] === 'ItemList'),
  }
}

for (const base of ['/catalog', `/catalog/${category.slug}`]) {
  test(`${base} exposes distinct pages through crawlable links and server HTML`, async ({ page, request }) => {
    const first = await page.evaluate(inspectListing, await (await request.get(base)).text())
    expect(first.next).toBe(`${base}/page/2`)
    const response = await request.get(first.next)
    expect(response.status()).toBe(200)
    const second = await page.evaluate(inspectListing, await response.text())
    expect(second.canonical).toBe(toSiteUrl(first.next))
    expect(second.title).toContain('Страница 2')
    expect(second.products.length).toBeGreaterThan(0)
    expect(second.products.every((url) => !first.products.includes(url))).toBe(true)
    expect(second.list.itemListElement.map((item) => new URL(item.url).pathname)).toEqual(second.products)

    await page.goto(base)
    await page.getByRole('link', { name: 'Следующая страница', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${base}/page/2$`))
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', toSiteUrl(first.next))
    await expect(page.getByRole('link', { name: 'Страница 2', exact: true })).toHaveAttribute('aria-current', 'page')
    await page.reload()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', toSiteUrl(first.next))
    await page.goBack()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', toSiteUrl(base))
  })
}

test('products with the same name have distinct metadata identified by their articles', async ({ page }) => {
  const duplicates = catalog.products.filter((p) => catalog.products.some((other) => other.id !== p.id && other.name === p.name))
  const titles = []
  const descriptions = []
  for (const product of duplicates) {
    await page.goto(`/product/${product.id}`)
    const title = await page.title()
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(title).toContain(String(product.id))
    expect(description).toContain(String(product.id))
    titles.push(title)
    descriptions.push(description)
  }
  expect(new Set(titles).size).toBe(titles.length)
  expect(new Set(descriptions).size).toBe(descriptions.length)
})

test('first-page aliases redirect and out-of-range listings return a real 404', async ({ request }) => {
  for (const base of ['/catalog', `/catalog/${category.slug}`]) {
    const first = await request.get(`${base}/page/1?utm_source=seo`, { maxRedirects: 0 })
    expect(first.status()).toBe(301)
    expect(first.headers().location).toBe(`${base}?utm_source=seo`)
    const invalid = await request.get(`${base}/page/99999`)
    expect(invalid.status()).toBe(404)
    expect(await invalid.text()).toContain('noindex, nofollow')
  }
})

test('filtering from a later catalog page returns to its base URL and can be cleared', async ({ page }) => {
  await page.goto('/catalog/page/2')
  const search = page.getByTestId('catalog-search-input')
  await search.fill('Барашек')
  await expect(page).toHaveURL(/\/catalog$/)
  await expect(page.getByTestId('product-card').first()).toContainText('Барашек')
  await search.fill('')
  await expect(page.getByRole('link', { name: 'Следующая страница', exact: true })).toHaveAttribute('href', '/catalog/page/2')
})
