import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    contentType: 'application/javascript', body: '',
  }))
  await page.route('https://mc.yandex.ru/**', (route) => route.fulfill({
    contentType: 'application/javascript', body: '',
  }))
})

for (const inputPause of [0, 250]) {
  test(`header search submits its query with a ${inputPause}ms input pause`, async ({ page }) => {
    await page.clock.install()
    await page.goto(inputPause ? '/catalog' : '/')
    await page.getByTestId('cookie-decline').click()
    await page.getByTestId('header-search-button').click()
    await page.getByTestId('header-search-input').fill('Барашек')
    if (inputPause) await page.clock.fastForward(inputPause)
    await page.getByTestId('header-search-input').press('Enter')

    await expect(page).toHaveURL(/\/catalog$/)
    await expect(page.getByTestId('header-search-panel')).toBeHidden()
    await expect(page.getByTestId('catalog-search-input')).toHaveValue('Барашек')
    await expect(page.getByTestId('product-card').first()).toContainText('Барашек')
    await page.clock.fastForward(500)
    await expect(page.getByTestId('catalog-search-input')).toHaveValue('Барашек')
  })
}

test('dismissing header search preserves the existing catalog filter', async ({ page }) => {
  await page.clock.install()
  await page.goto('/catalog')
  await page.getByTestId('cookie-decline').click()
  await page.getByTestId('catalog-search-input').fill('Барашек')
  await page.clock.fastForward(250)
  await expect(page.getByTestId('product-card').first()).toContainText('Барашек')

  await page.getByTestId('header-search-button').click()
  await page.getByTestId('header-search-input').fill('Корона')
  await page.clock.fastForward(250)
  await expect(page.getByTestId('catalog-search-input')).toHaveValue('Барашек')
  await page.mouse.click(5, 600)

  await expect(page.getByTestId('header-search-panel')).toBeHidden()
  await expect(page.getByTestId('catalog-search-input')).toHaveValue('Барашек')
  await expect(page.getByTestId('product-card').first()).toContainText('Барашек')
})

test('cookie details do not grant consent or initialize analytics', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('cookie-consent').getByRole('link', { name: 'Подробнее' }).click()

  await expect(page).toHaveURL(/\/about$/)
  expect(await page.evaluate(() => localStorage.getItem('cookie-consent'))).toBeNull()
  await expect(page.locator('#google-analytics-gtag, #yandex-metrika-tag')).toHaveCount(0)
  await expect(page.getByTestId('cookie-consent')).toBeVisible()
})

test('incomplete phone numbers cannot open either messenger, and correcting one allows both', async ({ page }) => {
  await page.addInitScript(() => {
    window.__openedMessengerUrls = []
    window.open = (url) => {
      window.__openedMessengerUrls.push(String(url))
      return null
    }
  })
  await page.goto('/contacts')
  await page.getByTestId('cookie-decline').click()
  await page.getByTestId('contact-name').fill('Dias')
  await page.getByTestId('contact-agreement').check()
  const phone = page.getByTestId('contact-phone')
  await phone.fill('71')
  await page.getByTestId('contact-whatsapp-submit').click()
  await page.getByTestId('contact-telegram-submit').click()

  expect(await page.evaluate(() => window.__openedMessengerUrls)).toEqual([])
  expect(await phone.evaluate((input) => input.validity.valid)).toBe(false)

  await phone.fill('77758537092')
  await expect(phone).toHaveValue('+7 (775) 853-70-92')
  await page.getByTestId('contact-whatsapp-submit').click()
  await page.getByTestId('contact-telegram-submit').click()
  const openedUrls = await page.evaluate(() => window.__openedMessengerUrls)
  expect(openedUrls).toHaveLength(2)
  expect(openedUrls[0]).toContain('https://wa.me/')
  expect(openedUrls[1]).toContain('https://t.me/')
})

test('catalog does not offer price sorting when all prices are on request', async ({ page }) => {
  await page.goto('/catalog')
  await expect(page.getByTestId('product-card').first()).toContainText('По запросу')
  await expect(page.getByRole('combobox', { name: 'Категория', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Сортировка', exact: true })).toHaveCount(0)
})
