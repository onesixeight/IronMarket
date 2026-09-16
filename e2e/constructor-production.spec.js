import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const storageKey = 'etalon-constructor-v1'
const storedProject = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey)

test.use({ serviceWorkers: 'block' })
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('cookie-consent', 'declined'))
})

test('production constructor has a rendered indexable entry and public navigation', async ({ page, request }) => {
  const response = await request.get('/constructor')
  expect(response.status()).toBe(200)
  const html = await response.text()
  const metadata = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'text/html')
    return {
      title: document.title,
      heading: document.querySelector('h1')?.textContent,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      robots: document.querySelector('meta[name="robots"]')?.content,
      canvas: Boolean(document.querySelector('[data-testid="constructor-canvas"]')),
      preloader: Boolean(document.querySelector('#preloader')),
    }
  }, html)
  expect(metadata.title).toContain('Конструктор ковки')
  expect(metadata.heading).toContain('Ваш рисунок.')
  expect(metadata.canonical).toBe('https://etalon-kovka.kz/constructor')
  expect(metadata.robots).toBe('index, follow')
  expect(metadata.canvas).toBe(true)
  expect(metadata.preloader).toBe(false)
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://etalon-kovka.kz/constructor</loc>')

  await page.goto('/')
  await page.getByTestId('nav-constructor').click()
  await expect(page).toHaveURL(/\/constructor$/)
  await expect(page.getByTestId('constructor-canvas')).toBeVisible()
})

test('production editor adds a corner, previews eight corners, undoes once and restores the saved project', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/constructor')
  await page.getByRole('button', { name: 'Начать с пустого', exact: true }).click()
  await expect(page.getByTestId('placed-element')).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Найти элемент' }).fill('6160')
  await page.locator('[data-product-id="6160"]').click()
  await expect(page.getByTestId('placed-element')).toHaveCount(1)
  await expect.poll(async () => (await storedProject(page))?.items.length).toBe(1)
  const before = await storedProject(page)

  await page.getByLabel('Область расстановки уголков').selectOption('all-panels')
  await page.getByRole('button', { name: 'Во все углы', exact: true }).click()
  const preview = page.getByRole('dialog', { name: 'Уголки во все углы', exact: true })
  await expect(preview).toBeVisible()
  await expect(preview.locator('[data-preview-highlight="added"]')).toHaveCount(7)
  expect(await storedProject(page)).toEqual(before)
  await preview.getByRole('button', { name: 'Расставить уголки', exact: true }).click()
  await expect(page.getByTestId('placed-element')).toHaveCount(8)
  await expect.poll(async () => (await storedProject(page))?.items.length).toBe(8)
  const arranged = await storedProject(page)
  expect(arranged.items.some((item) => item.id === before.items[0].id)).toBe(true)
  expect(arranged.items.every((item) => item.productId === 6160)).toBe(true)
  expect(arranged.items.filter((item) => item.x < arranged.width / 2)).toHaveLength(4)
  expect(arranged.items.filter((item) => item.x > arranged.width / 2)).toHaveLength(4)

  await page.getByRole('button', { name: 'Отменить действие', exact: true }).click()
  await expect(page.getByTestId('placed-element')).toHaveCount(1)
  await expect.poll(() => storedProject(page)).toEqual(before)
  await page.getByRole('button', { name: 'Повторить действие', exact: true }).click()
  await expect(page.getByTestId('placed-element')).toHaveCount(8)
  await expect.poll(() => storedProject(page)).toEqual(arranged)
  await page.reload()
  await expect(page.getByTestId('placed-element')).toHaveCount(8)
  expect(await storedProject(page)).toEqual(arranged)

  await page.getByRole('button', { name: 'Подготовить подборку для мастера', exact: true }).click()
  const handoff = page.getByRole('dialog', { name: 'Ваш рисунок готов', exact: true })
  const downloadEvent = page.waitForEvent('download')
  await handoff.getByRole('button', { name: 'Файл для продолжения редактирования', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('etalon-project.json')
  expect(JSON.parse(readFileSync(await download.path(), 'utf8'))).toEqual(arranged)
  expect(errors).toEqual([])
})

test('mobile production menu opens the editor and adds a persisted catalogue element', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Меню', exact: true }).click()
  await page.locator('#mobile-menu').getByRole('link', { name: 'Конструктор', exact: true }).click()
  await expect(page).toHaveURL(/\/constructor$/)
  await page.getByRole('button', { name: 'К рисунку', exact: true }).click()
  await page.getByRole('button', { name: 'Начать с пустого', exact: true }).click()
  await page.getByRole('button', { name: 'Детали', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Найти элемент' }).fill('6160')
  await page.locator('[data-product-id="6160"]').click()
  await expect(page.getByTestId('placed-element')).toHaveCount(1)
  await expect.poll(async () => (await storedProject(page))?.items.length).toBe(1)
  const saved = await storedProject(page)
  expect(saved.items[0].productId).toBe(6160)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.reload()
  await expect(page.getByTestId('placed-element')).toHaveCount(1)
  expect(await storedProject(page)).toEqual(saved)
})
