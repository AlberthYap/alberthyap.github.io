import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1024, height: 900 },
  { name: 'wide desktop', width: 1440, height: 900 },
]

test.describe('Delimiter tool responsive layout', () => {
  for (const viewport of viewports) {
    test(`${viewport.name} has no page overflow or collapsed copy`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/tools/delimiter')
      await page.waitForLoadState('domcontentloaded')
      await page.locator('#delimiter-source').waitFor({ state: 'visible', timeout: 15000 })

      const metrics = await page.evaluate(() => ({
        actualViewportWidth: window.innerWidth,
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        heroCopyWidth: document.querySelector('.tool-hero h1')?.getBoundingClientRect().width ?? 0,
        heroDescriptionWidth: document.querySelector('.tool-hero__description')?.getBoundingClientRect().width ?? 0,
        toolIntroWidth: document.querySelector('.dtool__workspace-header')?.getBoundingClientRect().width ?? 0,
        workspacePrivacyWidth: document.querySelector('.dtool__privacy-badge')?.getBoundingClientRect().width ?? 0,
        workspaceWidth: document.querySelector('.dtool')?.getBoundingClientRect().width ?? 0,
        editorCount: document.querySelectorAll('.editor-card').length,
      }))

      expect(metrics.actualViewportWidth).toBe(viewport.width)
      expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      expect(metrics.heroCopyWidth).toBeGreaterThan(200)
      expect(metrics.heroDescriptionWidth).toBeGreaterThan(200)
      expect(metrics.toolIntroWidth).toBeGreaterThan(200)
      expect(metrics.workspacePrivacyWidth).toBeGreaterThan(100)
      expect(metrics.workspaceWidth).toBeGreaterThan(280)
      expect(metrics.editorCount).toBe(2)
    })
  }

  for (const viewport of [
    { width: 375, height: 812, name: 'mobile' },
    { width: 768, height: 900, name: 'tablet' },
  ]) {
    test(`keeps the primary workflow simple at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/tools/delimiter')
    await page.waitForLoadState('domcontentloaded')
    await page.locator('.dtool[data-hydrated="true"]').waitFor({ state: 'visible' })

    // Transforms (advanced) hidden by default
    await expect(page.locator('#delimiter-transforms')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Try sample' })).toBeVisible()

    await page.getByRole('button', { name: 'Try sample' }).click()
    await expect(page.locator('#delimiter-source')).toHaveValue(/Name , Role/)
    await expect(page.locator('.output-surface')).toBeVisible()

    // Sidebar is collapsed by default (UX audit #7) — open it via the
    // Options toggle, then expand the Advanced accordion + transforms.
    await page.getByRole('button', { name: 'Options', exact: true }).click()
    await page.getByRole('button', { name: 'Advanced', exact: true }).click()
    await page.getByRole('button', { name: /Advanced transforms/ }).click()
    await expect(page.locator('#delimiter-transforms')).toBeVisible()
    await expect(page.getByRole('button', { name: /Advanced transforms/ })).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('These options change the result before you copy it.')).toBeVisible()

    const openMetrics = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }))
    expect(openMetrics.pageWidth).toBeLessThanOrEqual(openMetrics.viewportWidth)

    const preservedInput = await page.locator('#delimiter-source').inputValue()
    await page.locator('#output-format').selectOption('json-array')

    // Unique pill in action bar (always visible)
    await page.getByRole('button', { name: 'Unique' }).click()
    await expect(page.getByRole('button', { name: 'Unique' })).toHaveAttribute('aria-pressed', 'true')

    // Reset via advanced panel
    await page.getByRole('button', { name: 'Reset all' }).click()
    await expect(page.locator('#delimiter-source')).toHaveValue(preservedInput)
    await expect(page.locator('#output-format')).toHaveValue('json-array')
    await expect(page.getByRole('button', { name: 'Unique' })).toHaveAttribute('aria-pressed', 'false')

    // Clear input
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.locator('#delimiter-source')).toHaveValue('')
    await expect(page.locator('.output-empty')).toBeVisible()
    })
  }

  test('wraps long output inside the output surface without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/tools/delimiter')
    await page.waitForLoadState('domcontentloaded')
    await page.locator('.dtool[data-hydrated="true"]').waitFor({ state: 'visible' })
    await page.locator('#delimiter-source').waitFor({ state: 'visible' })

    await page.locator('#delimiter-source').fill(
      'column_one,column_two,column_three\n' +
      'a_very_long_value_that_should_wrap_inside_the_output_surface,' +
      'another_long_value_that_must_not_expand_the_page,' +
      'third_value',
    )

    const outputSurface = page.locator('.output-surface')
    await expect(outputSurface).toBeVisible()

    const overflow = await outputSurface.evaluate((element) => ({
      surfaceWidth: element.clientWidth,
      contentWidth: element.scrollWidth,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
    }))

    expect(overflow.contentWidth).toBeLessThanOrEqual(overflow.surfaceWidth)
    expect(overflow.pageWidth).toBeLessThanOrEqual(overflow.viewportWidth)
    expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.bodyClientWidth)

    // Raw output must use the same wrapping contract, not just the table view.
    await page.locator('#output-format').selectOption('json-array')
    await expect(page.locator('.output-raw')).toBeVisible()
    const rawOverflow = await outputSurface.evaluate((element) => ({
      surfaceWidth: element.clientWidth,
      contentWidth: element.scrollWidth,
    }))
    expect(rawOverflow.contentWidth).toBeLessThanOrEqual(rawOverflow.surfaceWidth)
  })

  test('sidebar controls are visible and interactive', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/tools/delimiter')
    await page.waitForLoadState('domcontentloaded')
    await page.locator('#delimiter-source').waitFor({ state: 'visible', timeout: 15000 })
    // Wait for Vue hydration before interacting (Options toggle needs @click).
    await page.locator('.dtool[data-hydrated="true"]').waitFor({ state: 'visible' })

    // Sidebar is collapsed by default (UX audit #7) — open it first.
    await page.getByRole('button', { name: 'Options', exact: true }).click()
    const sidebar = page.locator('.dtool__sidebar')
    await expect(sidebar).toBeVisible()

    // Mode buttons: Split active by default
    const splitBtn = page.locator('.dtool__sidebar').getByRole('button', { name: 'Split' })
    const joinBtn = page.locator('.dtool__sidebar').getByRole('button', { name: 'Join' })
    await expect(splitBtn).toBeVisible()
    await expect(joinBtn).toBeVisible()

    // Quote buttons — expand the Quotes accordion first (v5 sidebar
    // starts with Quotes collapsed).
    await page.getByRole('button', { name: 'Quotes', exact: true }).click()
    await expect(page.getByRole('button', { name: 'None' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()

    // Checkboxes — expand the Cleanup accordion first.
    await page.getByRole('button', { name: 'Cleanup', exact: true }).click()
    await expect(page.getByLabel('Trim spaces')).toBeChecked()
    await expect(page.getByLabel('Remove duplicates')).not.toBeChecked()
    await expect(page.getByLabel('Header row')).toBeChecked()
  })

  // Regression test for the description <p> collapsed to one word per line.
  // Tailwind v4 emitted .max-w-2xl as max-width:var(--spacing-2xl)=48px
  // because the custom named --spacing-* tokens shadowed the --container-*
  // scale. Fix: removed the named --spacing-{xs..2xl} tokens from @theme in
  // app/assets/css/main.css so max-w-{size} resolves via --container-*.
  //
  // Pass = AT LEAST ONE of: (a) surgical max-w-[42rem] literal in [slug].vue,
  // (b) @theme var(--container-2xl) resolves correctly. Fail = BOTH paths
  // broken. Single-path failures surface as visible bugs; this test can't
  // catch them.
  //
  // Bounds: 550 catches the 48px collapse and accommodates the design
  // choice of max-w-[36rem] (576px) for the description. 880 = parent flex
  // column width measured at 1440×900 during local layout review.
  // — re-measure if test viewport changes.
  test('hero description <p> is between 550–880px wide on 1440x900 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/tools/delimiter')
    await page.waitForLoadState('domcontentloaded')

    expect(page.viewportSize()).toEqual({ width: 1440, height: 900 })

    await page.locator('[data-testid="hero-description"]').waitFor({ state: 'visible', timeout: 15000 })

    const descriptionWidth = await page
      .getByTestId('hero-description')
      .evaluate((el) => el.getBoundingClientRect().width)

    expect(descriptionWidth).toBeGreaterThanOrEqual(550)
    expect(descriptionWidth).toBeLessThanOrEqual(880)
  })
})
