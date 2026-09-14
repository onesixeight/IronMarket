import { expect, test } from '@playwright/test'
import { preparePrerenderDocument } from '../scripts/prerender-routes.mjs'
import catalog from '../src/data/catalog.json' with { type: 'json' }

test('prerender removes loading overlays and prepares only the home responsive preload', async ({ page }) => {
  const fixture = `<html><head><link rel="preload" as="image" href="/old.webp"></head><body>
    <div id="preloader" style="opacity:0"></div>
    <main class="reveal-pending reveal-delay-20"><h1>Visible content</h1>
    <img fetchpriority="high" sizes="100vw" srcset="/small.webp 768w, /large.webp 1536w" src="/large.webp"></main>
    </body></html>`
  await page.setContent(fixture)
  await page.evaluate(preparePrerenderDocument, '/')
  await expect(page.locator('#preloader, .reveal-pending')).toHaveCount(0)
  const preload = page.locator('link[rel="preload"][as="image"]')
  await expect(preload).toHaveCount(1)
  await expect(preload).toHaveAttribute('imagesrcset', '/small.webp 768w, /large.webp 1536w')
  await expect(preload).toHaveAttribute('imagesizes', '100vw')
  await page.evaluate(preparePrerenderDocument, '/product/1')
  await expect(preload).toHaveCount(0)
})

test('missing product and category pages are noindex while valid products stay indexable', async ({ page }) => {
  await page.goto('/product/does-not-exist')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.getByRole('heading', { name: 'Товар не найден', exact: true })).toBeVisible()
  await page.goto('/catalog/does-not-exist')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.getByRole('heading', { name: 'Категория не найдена', exact: true })).toBeVisible()
  await page.goto(`/product/${catalog.products[0].id}`)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
  await expect(page.locator('h1')).toHaveText(catalog.products[0].name)
})

test('generated error and thank-you documents have their own visible noindex content', async ({ request, page }) => {
  for (const path of ['/404.html', '/thank-you/']) {
    const response = await request.get(path)
    const html = await response.text()
    const metadata = await page.evaluate((source) => {
      const document = new DOMParser().parseFromString(source, 'text/html')
      return {
        robots: document.querySelector('meta[name="robots"]')?.content,
        preloader: Boolean(document.querySelector('#preloader')),
        heading: document.querySelector('h1')?.textContent.trim(),
      }
    }, html)
    expect(metadata.robots).toBe('noindex, nofollow')
    expect(metadata.preloader).toBe(false)
    expect(metadata.heading).toBe(path === '/404.html' ? 'Страница не найдена' : 'Заказ оформлен')
  }
})
