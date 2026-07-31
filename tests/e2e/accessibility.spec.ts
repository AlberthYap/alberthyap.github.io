import { expect, test } from '@playwright/test'

/**
 * accessibility.spec.ts — Basic a11y smoke tests for critical
 * keyboard + screen-reader paths.
 */

test.describe('Accessibility basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
  })

  test('skip-to-main-content link is present and focusable', async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeAttached()

    // Press Tab to focus the skip link (first focusable element).
    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()
  })

  test('landmark regions are present', async ({ page }) => {
    await expect(
      page.locator('nav[aria-label="Primary"]'),
    ).toBeAttached()

    await expect(page.locator('#hero[aria-labelledby]')).toBeAttached()
    await expect(page.locator('#about[aria-labelledby]')).toBeAttached()
    await expect(page.locator('#projects[aria-labelledby]')).toBeAttached()

    await expect(
      page.locator('footer nav[aria-label="Social"]'),
    ).toBeAttached()
  })

  test('theme toggle is keyboard-operable', async ({ page }) => {
    const toggle = page.locator('[data-theme-picker]')
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('role', 'switch')

    // Focus and verify focusable.
    await toggle.focus()
    await expect(toggle).toBeFocused()

    // aria-checked reflects current theme.
    const theme = await page.locator('html').getAttribute('data-theme')
    await expect(toggle).toHaveAttribute(
      'aria-checked',
      theme === 'dark' ? 'true' : 'false',
    )
  })

  test('heading hierarchy has h1 on the page', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeAttached()
  })

  test('reduced-motion users see content without animation delays', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    const firstStagger = page.locator('[data-stagger]').first()
    await expect(firstStagger).toBeVisible()

    const opacity = await firstStagger.evaluate(
      (el) => window.getComputedStyle(el).opacity,
    )
    expect(opacity).toBe('1')
  })
})
