import { expect, test } from '@playwright/test'

async function analyticsSnapshot(page) {
  return page.evaluate(() => ({
    scripts: {
      google: Boolean(document.getElementById('google-analytics-gtag')),
      yandex: Boolean(document.getElementById('yandex-metrika-tag')),
    },
    dataLayer: Array.from(window.dataLayer || []).map((entry) => Array.from(entry)),
    yandexCalls: Array.from(window.ym?.a || []).map((entry) => Array.from(entry)),
    consent: localStorage.getItem('cookie-consent'),
  }))
}

function hasGoogleEvent(snapshot, eventName) {
  return snapshot.dataLayer.some((entry) => entry[0] === 'event' && entry[1] === eventName)
}

function hasYandexGoal(snapshot, goalName) {
  return snapshot.yandexCalls.some((entry) => entry[1] === 'reachGoal' && entry[2] === goalName)
}

test('desktop catalog navigation lands on the product list controls', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('nav-catalog').click()

  await expect(page).toHaveURL(/\/catalog$/)
  await expect(page.locator('#catalog-products')).toBeInViewport()
  await expect(page.getByTestId('product-card').first()).toBeVisible()
})

test('catalog search filters products and keeps inquiry links valid', async ({ page }) => {
  await page.goto('/catalog')

  const productCards = page.getByTestId('product-card')
  await expect(productCards.first()).toBeVisible()
  const initialCount = await productCards.count()

  await page.getByTestId('catalog-search-input').fill('Барашек')

  await expect.poll(async () => productCards.count()).toBeLessThan(initialCount)
  await expect(productCards.first()).toContainText('Барашек')

  const firstWhatsAppLink = productCards.first().getByTestId('product-card-whatsapp')
  await expect(firstWhatsAppLink).toHaveAttribute('href', /^https:\/\/wa\.me\//)
  expect(decodeURIComponent(await firstWhatsAppLink.getAttribute('href'))).toContain('/product/')

  await productCards.first().getByTestId('product-card-detail').click()
  await expect(page).toHaveURL(/\/product\/\d+$/)
})

test('product page exposes SEO metadata, inquiry link, and recently viewed', async ({ page }) => {
  await page.goto('/product/6150')

  const productImage = page.getByTestId('product-detail-image')
  await expect(productImage).toBeVisible()
  await expect.poll(async () => productImage.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://etalon-kovka.kz/product/6150')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://etalon-kovka.kz/product/6150')

  const productSchemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => (
    nodes
      .map((node) => JSON.parse(node.textContent || '{}'))
      .filter((schema) => schema['@type'] === 'Product')
  ))
  expect(productSchemas.some((schema) => String(schema.url).endsWith('/product/6150'))).toBe(true)

  const whatsappLink = page.getByTestId('product-whatsapp-link')
  await expect(whatsappLink).toHaveAttribute('href', /^https:\/\/wa\.me\//)
  expect(decodeURIComponent(await whatsappLink.getAttribute('href'))).toContain('/product/6150')

  await page.goto('/product/6151')

  const recentlyViewed = page.getByTestId('recently-viewed')
  await expect(recentlyViewed).toBeVisible()
  await expect(recentlyViewed.locator('a[href="/product/6150"]').first()).toBeVisible()
})

test('header search shows results and closes on outside click', async ({ page }) => {
  await page.goto('/')

  const searchPanel = page.getByTestId('header-search-panel')
  await page.getByTestId('header-search-button').click()
  await expect(searchPanel).toBeVisible()

  await page.getByTestId('header-search-input').fill('Барашек')
  await expect(page.getByTestId('header-search-result').first()).toBeVisible()

  await page.mouse.click(900, 520)
  await expect(searchPanel).toBeHidden()
})

test('contact form builds WhatsApp and Telegram leads without leaving the app', async ({ page }) => {
  await page.addInitScript(() => {
    window.__openedMessengerUrls = []
    window.open = (url) => {
      window.__openedMessengerUrls.push(String(url))
      return null
    }
  })

  await page.goto('/contacts?task=gates')

  await page.getByTestId('contact-name').fill('Dias')
  await page.getByTestId('contact-phone').fill('77758537092')
  await page.getByTestId('contact-email').fill('dias@example.com')
  await page.getByTestId('contact-message').fill('Need forged gate elements for Astana.')
  await page.getByTestId('contact-agreement').check()
  await page.getByTestId('contact-whatsapp-submit').click()
  await page.getByTestId('contact-telegram-submit').click()

  const openedUrls = await page.evaluate(() => window.__openedMessengerUrls)
  expect(openedUrls).toHaveLength(2)
  expect(openedUrls[0]).toContain('https://wa.me/')
  expect(openedUrls[1]).toContain('https://t.me/')
  expect(decodeURIComponent(openedUrls[0])).toContain('Dias')
  expect(decodeURIComponent(openedUrls[1])).toContain('Dias')
  expect(decodeURIComponent(openedUrls[0])).toContain('dias@example.com')
  expect(decodeURIComponent(openedUrls[1])).toContain('dias@example.com')
})

test('floating messenger opens links and collapses on outside click', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByTestId('floating-messenger-toggle')
  const whatsappLink = page.getByTestId('floating-whatsapp-link')
  const telegramLink = page.getByTestId('floating-telegram-link')

  await toggle.click()
  await expect(whatsappLink).toBeVisible()
  await expect(telegramLink).toBeVisible()
  await expect(whatsappLink).toHaveAttribute('href', /^https:\/\/wa\.me\//)
  await expect(telegramLink).toHaveAttribute('href', /^https:\/\/t\.me\//)

  await page.mouse.click(900, 180)
  await expect(whatsappLink).toBeHidden()
})

test('cookie consent gates analytics and tracks catalog and product intents', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: '',
  }))
  await page.route('https://mc.yandex.ru/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: '',
  }))

  await page.goto('/')

  await expect(page.getByTestId('cookie-consent')).toBeVisible()
  expect((await analyticsSnapshot(page)).scripts).toEqual({ google: false, yandex: false })

  await page.getByTestId('cookie-accept').click()
  await expect(page.getByTestId('cookie-consent')).toBeHidden()

  await expect.poll(async () => (await analyticsSnapshot(page)).scripts).toEqual({
    google: true,
    yandex: true,
  })

  const initialSnapshot = await analyticsSnapshot(page)
  expect(initialSnapshot.consent).toBe('accepted')
  expect(initialSnapshot.dataLayer.some((entry) => entry[0] === 'config' && entry[1] === 'G-3TYNDM52D9')).toBe(true)
  expect(hasGoogleEvent(initialSnapshot, 'page_view')).toBe(true)
  expect(initialSnapshot.yandexCalls.some((entry) => entry[0] === '110264764' && entry[1] === 'init')).toBe(true)
  expect(initialSnapshot.yandexCalls.some((entry) => entry[0] === '110264764' && entry[1] === 'hit')).toBe(true)

  await page.getByTestId('nav-catalog').click()
  await expect(page).toHaveURL(/\/catalog$/)
  await expect(page.locator('#catalog-products')).toBeInViewport()

  await expect.poll(async () => hasGoogleEvent(await analyticsSnapshot(page), 'catalog_open')).toBe(true)
  await expect.poll(async () => hasYandexGoal(await analyticsSnapshot(page), 'catalog_open')).toBe(true)

  await page.getByTestId('product-card').first().getByTestId('product-card-detail').click()
  await expect(page).toHaveURL(/\/product\/\d+$/)

  await expect.poll(async () => hasGoogleEvent(await analyticsSnapshot(page), 'select_item')).toBe(true)
  await expect.poll(async () => hasYandexGoal(await analyticsSnapshot(page), 'product_open')).toBe(true)
})

test('lead picker prepares scenario-specific messenger and form paths', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('lead-scenario-railings').click()
  await expect(page.getByText('Вы выбрали')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Перила', exact: true })).toBeVisible()

  const whatsappLink = page.getByTestId('lead-picker-whatsapp')
  const telegramLink = page.getByTestId('lead-picker-telegram')
  const formLink = page.getByTestId('lead-picker-form')

  await expect(whatsappLink).toHaveAttribute('href', /^https:\/\/wa\.me\//)
  await expect(telegramLink).toHaveAttribute('href', /^https:\/\/t\.me\//)
  expect(decodeURIComponent(await whatsappLink.getAttribute('href'))).toContain('Задача: Перила')
  expect(decodeURIComponent(await telegramLink.getAttribute('href'))).toContain('Задача: Перила')
  await expect(formLink).toHaveAttribute('href', '/contacts?task=railings')

  await formLink.click()
  await expect(page).toHaveURL(/\/contacts\?task=railings$/)
  await expect(page.getByTestId('contact-message')).toHaveValue(/Задача: Перила/)
})

test.describe('mobile critical navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true })

  test('bottom navigation reaches catalog, lead form, and delivery pages', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('cookie-decline').click()
    await expect(page.getByTestId('cookie-consent')).toBeHidden()

    await expect(page.getByTestId('mobile-nav-catalog')).toBeVisible()
    await expect(page.getByTestId('nav-catalog')).toBeHidden()

    await page.getByTestId('mobile-nav-catalog').click()
    await expect(page).toHaveURL(/\/catalog$/)
    await expect(page.locator('#catalog-products')).toBeInViewport()

    await page.getByTestId('mobile-nav-lead').click()
    await expect(page).toHaveURL(/\/contacts$/)
    await expect(page.getByTestId('contact-message')).toBeVisible()

    await page.getByTestId('mobile-nav-delivery').click()
    await expect(page).toHaveURL(/\/delivery$/)
    await expect(page.getByRole('heading', { name: /Доставка и заявка/ })).toBeVisible()
  })
})
