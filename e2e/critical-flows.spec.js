import { expect, test } from '@playwright/test'

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

test('contact form builds a WhatsApp lead without leaving the app', async ({ page }) => {
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

  const openedUrls = await page.evaluate(() => window.__openedMessengerUrls)
  expect(openedUrls).toHaveLength(1)
  expect(openedUrls[0]).toContain('https://wa.me/')
  expect(decodeURIComponent(openedUrls[0])).toContain('Dias')
  expect(decodeURIComponent(openedUrls[0])).toContain('dias@example.com')
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
