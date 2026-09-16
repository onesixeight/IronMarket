import { test, expect } from '@playwright/test'

test('desktop header shows catalog navigation and hides the mobile menu trigger', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Меню', exact: true })).toBeHidden()
  await expect(page.getByTestId('nav-catalog')).toBeVisible()
  await expect(page.getByTestId('nav-catalog')).toHaveAttribute('href', '/catalog')
})

test.describe('mobile header controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('menu covers the header, closes on outside click and Escape, and releases scroll', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('cookie-decline').click()
    const trigger = page.getByRole('button', { name: 'Меню', exact: true })
    const menu = page.locator('#mobile-menu')
    await trigger.click()
    await expect(menu).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
    expect(await menu.evaluate((element) => element.contains(document.elementFromPoint(385, 30)))).toBe(true)
    await page.mouse.click(5, 300)
    await expect(menu).toBeHidden()
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
    await trigger.click()
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
    await trigger.click()
    await menu.getByRole('link', { name: 'Каталог', exact: true }).click()
    await expect(page).toHaveURL(/\/catalog$/)
    await expect(menu).toBeHidden()
  })

  test('search Escape works inside the input and bottom navigation has visible accessible names', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('cookie-decline').click()
    const trigger = page.getByTestId('header-search-button')
    await trigger.click()
    await page.getByTestId('header-search-input').fill('Корона')
    await page.getByTestId('header-search-input').press('Escape')
    await expect(page.getByTestId('header-search-panel')).toBeHidden()
    await expect(trigger).toBeFocused()
    const nav = page.getByRole('navigation', { name: 'Быстрая навигация' })
    for (const name of ['Главная', 'Каталог', 'Заявка', 'Доставка']) {
      const link = nav.getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveText(name)
    }
  })
})
