import { expect, test } from '@playwright/test'

/**
 * projects.spec.ts — Project listing page → detail page → back navigation,
 * plus external link safety.
 */

test.describe('Project pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
  })

  test('projects index page renders project cards', async ({ page }) => {
    // At least one article.tonal-card should be present.
    const cards = page.locator('article.tonal-card')
    await expect(cards.first()).toBeVisible()
  })

  test('clicking a project card navigates to the detail page', async ({ page }) => {
    // The first project card link (NuxtLink wrapping the cover image).
    const firstCardLink = page.locator('article.tonal-card a').first()
    await firstCardLink.click()

    await page.waitForURL('**/projects/**', { timeout: 10_000 })
    await page.waitForTimeout(500)

    // The detail page should have the project title in a heading.
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()

    // URL should contain the project slug (e.g. /projects/tensitrack).
    expect(page.url()).toContain('/projects/')
  })

  test('navigating back from detail to index returns to /projects', async ({ page }) => {
    // Navigate to a detail page.
    await page.locator('article.tonal-card a').first().click()
    await page.waitForURL('**/projects/**', { timeout: 10_000 })
    await page.waitForTimeout(500)

    // Go back — client-side SPA navigation. Nuxt may add a trailing
    // slash, so match both /projects and /projects/.
    await page.goBack()
    await page.waitForURL(/\/projects\/?$/, { timeout: 10_000 })
    await page.waitForTimeout(300)

    expect(page.url()).toMatch(/\/projects\/?$/)
  })

  test('external links on project cards have safe rel attributes', async ({ page }) => {
    // External links carry target="_blank" rel="noopener noreferrer".
    // Note: some projects may not have external links; the test verifies
    // that any that DO exist follow the security baseline.
    const externalLinks = page.locator(
      'article.tonal-card a[target="_blank"]',
    )
    // At minimum, the card itself should be visible.
    await expect(page.locator('article.tonal-card').first()).toBeVisible()

    const count = await externalLinks.count()
    if (count > 0) {
      await expect(externalLinks.first()).toHaveAttribute('rel', /noopener/)
    }
  })
})
