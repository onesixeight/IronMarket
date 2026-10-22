import { expect, test } from '@playwright/test'
import catalog from '../src/data/catalog.json' with { type: 'json' }
import { CONTACTS } from '../src/config/contacts.js'
import { toSiteUrl } from '../src/config/site.js'

function readMetadata(source) {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  return {
    title: doc.title,
    description: doc.querySelector('meta[name="description"]')?.content,
    canonical: doc.querySelector('link[rel="canonical"]')?.href,
    heading: doc.querySelector('h1')?.textContent.trim(),
    text: doc.querySelector('main')?.textContent,
  }
}

test('all categories have local search metadata while visible names and descriptions stay unchanged', async ({ page, request }) => {
  for (const category of catalog.categories) {
    const path = `/catalog/${category.slug}`
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const metadata = await page.evaluate(readMetadata, await response.text())
    expect(metadata.title).toContain('в Астане')
    expect(metadata.description).toContain('Астане')
    expect(metadata.canonical).toBe(toSiteUrl(path))
    expect(metadata.heading).toBe(category.name)
    expect(metadata.text).toContain(category.description)
    await page.goto(path)
    await expect(page).toHaveTitle(metadata.title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', metadata.description)
    await expect(page.locator('h1')).toHaveText(category.name)
  }
})

test('contacts metadata uses the existing public location record', async ({ page, request }) => {
  const response = await request.get('/contacts')
  const metadata = await page.evaluate(readMetadata, await response.text())
  expect(metadata.title).toContain('Астане')
  expect(metadata.description).toContain(CONTACTS.phone.display)
  expect(metadata.description).toContain(CONTACTS.location.streetAddress)
  expect(metadata.description).toContain(CONTACTS.hours.primary)
  await page.goto('/contacts')
  await expect(page).toHaveTitle(metadata.title)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', metadata.description)
})
