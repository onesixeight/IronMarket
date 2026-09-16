import { expect, test } from '@playwright/test'
import catalog from '../src/data/catalog.json' with { type: 'json' }
import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, toAbsoluteSiteUrl, toSiteUrl } from '../src/config/site.js'
import { COMPANY, COMPANY_SINCE } from '../src/config/company.js'

const product = catalog.products.find((item) => catalog.categories.some((category) => category.slug === item.categorySlug))
const category = catalog.categories.find((item) => item.slug === product.categorySlug)

function inspectDocument(source) {
  const doc = typeof source === 'string' ? new DOMParser().parseFromString(source, 'text/html') : document
  const meta = (selector) => [...doc.querySelectorAll(selector)].map((element) => element.getAttribute('content'))
  return {
    title: doc.title,
    canonical: [...doc.querySelectorAll('link[rel="canonical"]')].map((element) => element.getAttribute('href')),
    description: meta('meta[name="description"]'),
    ogUrl: meta('meta[property="og:url"]'),
    ogType: meta('meta[property="og:type"]'),
    ogImage: meta('meta[property="og:image"]'),
    twitterImage: meta('meta[name="twitter:image"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')]
      .filter((element) => element.textContent.trim())
      .map((element) => JSON.parse(element.textContent)),
    breadcrumbs: [...doc.querySelectorAll('nav[aria-label="Хлебные крошки"] li')].map((item) => {
      const element = item.querySelector('a, [aria-current="page"]')
      return { label: element?.textContent.trim(), to: element?.getAttribute('href') }
    }),
  }
}

function expectMetadata(metadata, path, image = DEFAULT_SOCIAL_IMAGE) {
  expect(metadata.title).toContain(SITE_NAME)
  expect(metadata.description).toHaveLength(1)
  expect(metadata.description[0].length).toBeGreaterThan(20)
  expect(metadata.canonical).toEqual([toSiteUrl(path)])
  expect(metadata.ogUrl).toEqual([toSiteUrl(path)])
  expect(metadata.ogType).toEqual(['website'])
  expect(metadata.ogImage).toEqual([toAbsoluteSiteUrl(image)])
  expect(metadata.twitterImage).toEqual(metadata.ogImage)
  expect(metadata.twitterCard).toEqual(['summary_large_image'])
}

function expectBreadcrumbs(metadata, path) {
  const schemas = metadata.schemas.filter((item) => item['@type'] === 'BreadcrumbList')
  if (!metadata.breadcrumbs.length) {
    expect(schemas).toHaveLength(0)
    return
  }
  expect(schemas).toHaveLength(1)
  expect(schemas[0]['@context']).toBe('https://schema.org')
  expect(schemas[0].itemListElement).toEqual(metadata.breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: toSiteUrl(item.to || path),
  })))
  expect(metadata.breadcrumbs.every((item) => Boolean(item.label))).toBe(true)
}

test('storefront routes render unique canonical/social metadata and matching visible breadcrumbs', async ({ page }) => {
  const routes = [
    '/', '/catalog', '/about', '/delivery', '/contacts',
    `/catalog/${category.slug}`, `/product/${product.id}`,
  ]
  for (const path of routes) {
    await page.goto(`${path}?seo-check=1#content`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', toSiteUrl(path))
    const metadata = await page.evaluate(inspectDocument)
    expectMetadata(metadata, path, path.startsWith('/product/') ? product.image : undefined)
    expectBreadcrumbs(metadata, path)
  }
})

test('SPA navigation replaces product/category breadcrumbs and removes them on the homepage', async ({ page }) => {
  await page.goto(`/product/${product.id}`)
  const breadcrumbs = page.getByRole('navigation', { name: 'Хлебные крошки' })
  await expect(breadcrumbs).toContainText(product.name)
  expectBreadcrumbs(await page.evaluate(inspectDocument), `/product/${product.id}`)

  await breadcrumbs.getByRole('link', { name: category.name, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/catalog/${category.slug}$`))
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText(category.name)
  let metadata = await page.evaluate(inspectDocument)
  expectBreadcrumbs(metadata, `/catalog/${category.slug}`)
  expect(metadata.schemas.some((item) => item['@type'] === 'Product' || item['@type'] === 'ItemPage')).toBe(false)

  await breadcrumbs.getByRole('link', { name: 'Главная', exact: true }).click()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', toSiteUrl('/'))
  await expect(breadcrumbs).toHaveCount(0)
  metadata = await page.evaluate(inspectDocument)
  expectBreadcrumbs(metadata, '/')
  expect(metadata.schemas.find((item) => item['@type'] === 'LocalBusiness')).toMatchObject({
    name: SITE_NAME,
    url: toSiteUrl('/'),
    logo: toAbsoluteSiteUrl(DEFAULT_SOCIAL_IMAGE),
  })
})

test('unknown products and categories have explicit breadcrumbs without leftover product data', async ({ page }) => {
  for (const [path, label] of [
    ['/product/seo-missing-product', 'Товар не найден'],
    ['/catalog/seo-missing-category', 'Категория не найдена'],
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    const metadata = await page.evaluate(inspectDocument)
    expectBreadcrumbs(metadata, path)
    expect(metadata.breadcrumbs.at(-1).label).toBe(label)
    expect(metadata.schemas.some((item) => ['Product', 'ItemPage', 'ItemList'].includes(item['@type']))).toBe(false)
  }
})

test('generated HTML contains page-specific metadata and breadcrumbs before JavaScript runs', async ({ page, request }) => {
  for (const path of ['/', '/about', '/catalog', `/catalog/${category.slug}`, `/product/${product.id}`]) {
    const response = await request.get(path)
    expect(response.ok()).toBe(true)
    const metadata = await page.evaluate(inspectDocument, await response.text())
    expectMetadata(metadata, path, path.startsWith('/product/') ? product.image : undefined)
    expectBreadcrumbs(metadata, path)
    if (path !== '/') expect(metadata.breadcrumbs.length).toBeGreaterThanOrEqual(2)
  }
})

test('about counters expose final values and respect reduced motion in the rendered page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/about')
  const counters = page.locator('.animated-counter')
  await expect(counters.first()).toBeVisible()
  for (const counter of await counters.all()) {
    const finalValue = await counter.getAttribute('aria-label')
    expect(finalValue).toBeTruthy()
    await expect(counter.locator('[aria-hidden="true"]')).toHaveText(finalValue)
  }
})

test('home and about use the confirmed founding year instead of conflicting experience counts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const hero = page.getByRole('region', { name: 'Главный слайдер' })
  await expect(hero.getByText(COMPANY_SINCE, { exact: true })).toBeVisible()
  await expect.poll(() => page.locator('.metric-chip').filter({ hasText: COMPANY_SINCE }).count()).toBeGreaterThanOrEqual(2)
  await expect(page.locator('main')).not.toContainText(/(?:18|20)\+\s*лет/i)

  await page.goto('/about')
  await expect(page.locator('main')).toContainText(`${COMPANY_SINCE} мы продаём`)
  await expect(page.getByText(String(COMPANY.foundedYear), { exact: true })).toBeVisible()
  await expect(page.locator(`.animated-counter[aria-label="${COMPANY.foundedYear}"]`)).toHaveCount(0)
  await expect(page.getByText('Год основания', { exact: true })).toBeVisible()
  await expect(page.locator('main')).not.toContainText(/(?:18|20)\+\s*лет/i)
})
