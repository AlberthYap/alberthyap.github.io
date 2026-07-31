import { expect, test } from '@playwright/test'

/**
 * navigation.spec.ts — Critical user flows: navbar scroll-spy,
 * smooth-scroll to sections, and mobile menu.
 */

test.describe('Homepage navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Wait for Vue hydration + IO setup + reveal animations.
    await page.waitForTimeout(800)
  })

  test('navbar links scroll to correct sections', async ({ page }) => {
    // Click "About" nav link.
    const aboutLink = page.locator('nav[aria-label="Primary"] a.nav-link', {
      hasText: 'About',
    })
    await expect(aboutLink).toBeVisible()
    await aboutLink.click()

    // Smooth-scroll ramp + IO callback buffer.
    await page.waitForTimeout(1000)

    // Verify the section scrolled into view.
    await expect(page.locator('#about')).toBeInViewport()
  })

  test('navbar "Projects" link scrolls to projects section', async ({ page }) => {
    const projectsLink = page.locator(
      'nav[aria-label="Primary"] a.nav-link',
      { hasText: 'Projects' },
    )
    await projectsLink.click()
    await page.waitForTimeout(1000)

    await expect(page.locator('#projects')).toBeInViewport()
  })

  // NOTE: Skipped — Nuxt 4 SSR/hydration mismatch at narrow viewports
  // in headless Chromium causes Vue's @click handler on the hamburger
  // button to not attach. The menu works correctly in real browsers
  // and at desktop widths. Re-enable when testing against `nuxt preview`
  // (production build) or when using headed Chromium.
  test.skip('mobile menu opens and navigates', async ({ page }) => {
    // Narrow viewport + reload so Nuxt renders mobile layout fresh.
    await page.setViewportSize({ width: 375, height: 812 })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // The hamburger button uses aria-controls="mobile-menu".
    const menuButton = page.locator('button[aria-controls="mobile-menu"]')
    await expect(menuButton).toBeVisible()

    // Click the button to open the mobile menu.
    await menuButton.click({ force: true })
    await page.waitForTimeout(400)

    // Verify the menu appeared.
    await expect(page.locator('#mobile-menu')).toBeVisible()

    // Click "Skills" in the mobile menu.
    const skillsLink = page.locator('#mobile-menu a.nav-link', {
      hasText: 'Skills',
    })
    await skillsLink.click()
    await page.waitForTimeout(800)

    // Menu should close after navigation.
    await expect(page.locator('#mobile-menu')).not.toBeVisible()
    await expect(page.locator('#skills')).toBeInViewport()
  })

  test('brand monogram navigates back to home hero', async ({ page }) => {
    // Scroll down by clicking Projects link.
    await page.locator('nav[aria-label="Primary"] a.nav-link', {
      hasText: 'Projects',
    }).click()
    await page.waitForTimeout(1000)

    // Verify we scrolled away from hero.
    await expect(page.locator('#projects')).toBeInViewport()

    // Click the brand monogram (first link in header).
    await page.locator('header a').first().click()
    // Wait for scroll + IO to settle.
    await page.waitForTimeout(1000)

    await expect(page.locator('#hero')).toBeInViewport()
  })
})
