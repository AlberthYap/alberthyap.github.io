import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import DelimiterTool from '~~/app/components/tools/DelimiterTool.vue'

const SAMPLE = [
  'Name , Role, Language , Experience',
  'Alice Chen,Frontend Lead,TypeScript,7 years',
  '  Bima Santoso ,DevOps,SRE,5 years',
  'Clara Müller,Backend,Rust,4 years',
  'David Park,Full Stack,Go,9 years',
  '"Eka Putri"  ,Data Engineer,Python,6 years',
  'David Park,Full Stack,Go,9 years',
].join('\n')

function parseRowCount(text: string): number {
  const m = text.match(/(\d+)\s*rows?\b/i)
  return m ? Number(m[1]) : -1
}

// Helper: locate the row-count readout regardless of which markup
// class the component currently uses for it. Tests written before
// the premium overhaul targeted `.editor-card__meta`; the polished
// version uses `.output-stat-strip` (same DOM role).
function getRowMeta(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('.output-stat-strip, .editor-card__meta')
}

// Helper: ensure the component is in Split mode for tests that
// exercise split-mode semantics (SAMPLE-based test data). The
// component's default mode is 'join', so tests that read row
// counts off a multi-line CSV need to opt in to split first.
// Also opens the sidebar since Split/Join buttons live inside it.
async function enterSplitMode(wrapper: ReturnType<typeof mount>) {
  await openSidebar(wrapper)
  const splitBtn = wrapper.findAll('button').find(
    (b) => b.text().trim() === 'Split' && b.classes().includes('dtool__seg-btn'),
  )
  if (splitBtn && !splitBtn.classes().includes('dtool__seg-btn--active')) {
    await splitBtn.trigger('click')
    await nextTick()
  }
}

// Helper: open the sidebar config (hidden by default per UX audit #7).
// The Options toggle button sits in the workspace header.
async function openSidebar(wrapper: ReturnType<typeof mount>) {
  const optsBtn = wrapper.find('.dtool__options-toggle')
  if (optsBtn.exists() && optsBtn.attributes('aria-expanded') === 'false') {
    await optsBtn.trigger('click')
    await nextTick()
  }
}

describe('DelimiterTool — defaults', () => {
  it('sidebar is hidden by default (Options toggle shows aria-expanded=false)', () => {
    const wrapper = mount(DelimiterTool)
    const toggle = wrapper.find('.dtool__options-toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe('dtool-sidebar')
    expect(wrapper.find('#dtool-sidebar').exists()).toBe(false)
  })

  it('clicking Options toggle opens the sidebar and flips aria-expanded', async () => {
    const wrapper = mount(DelimiterTool)
    const toggle = wrapper.find('.dtool__options-toggle')
    await toggle.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#dtool-sidebar').exists()).toBe(true)
  })

  it('clicking Options toggle twice closes the sidebar again', async () => {
    const wrapper = mount(DelimiterTool)
    const toggle = wrapper.find('.dtool__options-toggle')
    await toggle.trigger('click')
    await nextTick()
    await toggle.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#dtool-sidebar').exists()).toBe(false)
  })

  it('mounts in Join mode by default (Split segmented button is inactive)', async () => {
    const wrapper = mount(DelimiterTool)
    await openSidebar(wrapper)

    const splitBtn = wrapper.findAll('button').find(
      (b) => b.text().trim() === 'Split' && b.classes().includes('dtool__seg-btn'),
    )
    const joinBtn = wrapper.findAll('button').find(
      (b) => b.text().trim() === 'Join' && b.classes().includes('dtool__seg-btn'),
    )
    expect(splitBtn).toBeTruthy()
    expect(joinBtn).toBeTruthy()
    expect(splitBtn!.classes()).not.toContain('dtool__seg-btn--active')
    expect(joinBtn!.classes()).toContain('dtool__seg-btn--active')
  })

  it('continues auto-detecting after an internally detected delimiter change', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(DelimiterTool)
      await openSidebar(wrapper)
      const split = wrapper.findAll('button').find((b) => b.text().trim() === 'Split')!
      await split.trigger('click')

      await wrapper.find('#delimiter-source').setValue('name|role\nAlice|Engineer')
      await nextTick()
      vi.advanceTimersByTime(800)
      await nextTick()
      expect(wrapper.find('.dtool__autodetect-toast').text()).toContain('Pipe')

      await wrapper.find('#delimiter-source').setValue('name,role\nAlice,Engineer')
      await nextTick()
      vi.advanceTimersByTime(800)
      await nextTick()
      expect(wrapper.find('.dtool__autodetect-toast').text()).toContain('Comma')
    } finally {
      vi.useRealTimers()
    }
  })

  it('join mode collapses N input lines into 1 row/1 col (outDelim=comma)', async () => {
    const FIVE_LINES = [
      'Alice',
      'Bima',
      'Clara',
      'David',
      'Eka',
    ].join('\n')

    const wrapper = mount(DelimiterTool)
    await wrapper.find('#delimiter-source').setValue(FIVE_LINES)
    await nextTick()
    await nextTick()

    // Should be 1 row (joined into one cell) in join mode by default.
    const meta = getRowMeta(wrapper)
    expect(meta.exists()).toBe(true)
    expect(parseRowCount(meta.text())).toBe(1)

    // Output should contain the join literal. The Table tab renders a
    // real <table> now — read the surface text content instead of
    // `.output-surface code` (which only exists in JSON/Raw views).
    const out = wrapper.find('.output-surface')
    expect(out.text().trim()).toBe('Alice,Bima,Clara,David,Eka')
  })
})

describe('DelimiterTool — dedupe (remove duplicates)', () => {
  it('reports 7 rows on the sample with dedupe OFF', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(SAMPLE)
    await nextTick()

    const meta = getRowMeta(wrapper)
    expect(meta.exists()).toBe(true)
    expect(parseRowCount(meta.text())).toBe(7)
  })

  it('drops from 7 → 6 rows when ⊟ Unique is toggled on', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(SAMPLE)
    await nextTick()

    // Sanity: 7 rows before
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(7)

    // Toggle dedupe via the action-bar pill (⊟ Unique).
    // The pill uses `aria-pressed` and contains the word "Unique".
    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))
    expect(unique, 'Unique action-bar pill must exist').toBeTruthy()

    await unique!.trigger('click')
    await nextTick()
    await nextTick()

    expect(unique!.attributes('aria-pressed')).toBe('true')

    const meta = getRowMeta(wrapper)
    const rowsAfter = parseRowCount(meta.text())
    expect(rowsAfter).toBe(6)

    // The duplicate 'David Park' row should appear only once in the table output.
    const out = wrapper.find('.output-surface')
    const matches = out.text().match(/David Park/g) ?? []
    expect(matches.length).toBe(1)
  })

  it('drops from 7 → 6 rows when the sidebar "Remove duplicates" checkbox is toggled', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(SAMPLE)
    await nextTick()

    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(7)

    // Sidebar checkbox label "Remove duplicates".
    // Sidebar is open from enterSplitMode.
    const labels = wrapper.findAll('label.dtool__check')
    const removeDupLabel = labels.find((l) => l.text().includes('Remove duplicates'))
    expect(removeDupLabel, 'Remove-duplicates label must exist').toBeTruthy()
    const cb = removeDupLabel!.find('input[type="checkbox"]')
    expect(cb.exists()).toBe(true)

    await cb.setValue(true)
    await nextTick()
    await nextTick()

    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(6)
  })

  it('restores 7 rows when dedupe is toggled back off', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(SAMPLE)
    await nextTick()

    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))!

    await unique.trigger('click')
    await nextTick()
    await nextTick()
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(6)

    await unique.trigger('click')
    await nextTick()
    await nextTick()
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(7)
    expect(unique.attributes('aria-pressed')).toBe('false')
  })

  it('case-sensitive: "david park" and "David Park" stay separate when dedupe is on', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue([
      'Name,Role',
      'David Park,Frontend',
      'david park,Backend',
    ].join('\n'))
    await nextTick()

    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))!
    await unique.trigger('click')
    await nextTick()
    await nextTick()

    // Case-insensitive comparison would dedupe these; the current
    // implementation is strict-case (case-sensitive). Document that.
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(3)
  })

  it('shows a "Removed N duplicates" notice when dedupe reduces rows (UX signal)', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(SAMPLE)
    await nextTick()
    await nextTick() // seed baseline in onMounted

    // Sanity: notice not present before toggle
    expect(wrapper.find('.dtool__dedupe-notice').exists()).toBe(false)

    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))!
    await unique.trigger('click')
    await nextTick()
    await nextTick()

    const notice = wrapper.find('.dtool__dedupe-notice')
    expect(notice.exists()).toBe(true)
    expect(notice.text()).toMatch(/Removed\s+1\s+duplicate\b/)
  })

  it('does not show notice when dedupe is toggled but no duplicates exist', async () => {
    const UNIQUE_ONLY = [
      'Name,Role',
      'Alice Chen,Frontend',
      'Bima Santoso,DevOps',
    ].join('\n')

    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(UNIQUE_ONLY)
    await nextTick()
    await nextTick()

    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))!
    await unique.trigger('click')
    await nextTick()
    await nextTick()

    // Row count unchanged (3 → 3), no notice surfaces.
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(3)
    expect(wrapper.find('.dtool__dedupe-notice').exists()).toBe(false)
  })

  it('case-insensitive opt-in collapses "david park" / "David Park" / "DAVID PARK" into one row', async () => {
    // Data rows differ ONLY by casing of column 1 — same Role "Frontend".
    // Without case-insensitive, all 3 are distinct rows. With it, all 3
    // compute the same lowercase key and collapse into the kept row.
    const MIXED_CASE = [
      'Name,Role',
      'David Park,Frontend',
      'david park,Frontend',
      'DAVID PARK,Frontend',
    ].join('\n')

    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(MIXED_CASE)
    await nextTick()
    await nextTick()

    // Default: 4 rows (header + 3 case-distinct entries).
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(4)

    // Sanity: Case-insensitive sub-option is hidden until dedupe is ON.
    let labels = wrapper.findAll('label.dtool__check--sub')
    expect(labels.length).toBe(0)

    // Toggle dedupe ON via action-bar pill.
    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))!
    await unique.trigger('click')
    await nextTick()
    await nextTick()

    // Strict-case default still keeps all 4 rows.
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(4)

    // Sub-option now visible (because dedupeOn=true).
    labels = wrapper.findAll('label.dtool__check--sub')
    expect(labels.length).toBe(1)
    const insensitiveLabel = labels[0]!
    expect(insensitiveLabel.text()).toContain('Case-insensitive')
    const cb = insensitiveLabel.find('input[type="checkbox"]')
    expect(cb.exists()).toBe(true)

    await cb.setValue(true)
    await nextTick()
    await nextTick()

    // Collapses to 2 rows (header + 1 collapsed "David Park"-class row).
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(2)

    // The kept variant should be the FIRST occurrence (original casing
    // preserved for output — only the dedupe key is lowercased).
    const outText = wrapper.find('.output-surface').text()
    expect(outText).toContain('David Park')
    expect(outText).not.toContain('david park')
    expect(outText).not.toContain('DAVID PARK')
  })

  it('groups Remove duplicates + Case-insensitive under a "Dedupe" fieldset/legend for screen readers', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)

    // Outer wrapper for the dedupe controls
    expect(wrapper.find('fieldset.dtool__dedupe-group').exists()).toBe(true)

    // Legend exists and reads "Dedupe" — the screen-reader-facing label
    // for the grouped controls. Visually sr-only, but still announced.
    const legend = wrapper.find('fieldset.dtool__dedupe-group > legend')
    expect(legend.exists()).toBe(true)
    expect(legend.text()).toBe('Dedupe')

    // "Remove duplicates" must remain directly under the wrapper
    const removeDup = wrapper.find('fieldset.dtool__dedupe-group label.dtool__check:not(.dtool__check--sub)')
    expect(removeDup.exists()).toBe(true)
    expect(removeDup.text()).toContain('Remove duplicates')
  })

  it('resetTransforms also resets Case-insensitive sub-option', async () => {
    const wrapper = mount(DelimiterTool); await enterSplitMode(wrapper)
    await wrapper.find('#delimiter-source').setValue(SAMPLE)
    await nextTick()
    await nextTick()

    // Enable both dedupe and case-insensitive.
    const pressablePills = wrapper.findAll('button[aria-pressed]')
    const unique = pressablePills.find((b) => /\bUnique\b/.test(b.text()))!
    await unique.trigger('click')
    await nextTick()
    await nextTick()

    const labels = wrapper.findAll('label.dtool__check--sub')
    expect(labels.length).toBe(1)
    await labels[0]!.find('input[type="checkbox"]').setValue(true)
    await nextTick()

    // Open the Advanced panel and click Reset all.
    await wrapper.find('button[aria-controls="delimiter-transforms"]').trigger('click')
    await nextTick()
    const advanceIds = wrapper.findAll('button').filter((b) => /Reset all/.test(b.text()))
    expect(advanceIds.length).toBeGreaterThan(0)
    await advanceIds[0]!.trigger('click')
    await nextTick()
    await nextTick()

    // dedupeOn should be false again → sub-option hidden.
    expect(wrapper.findAll('label.dtool__check--sub').length).toBe(0)
    expect(parseRowCount(getRowMeta(wrapper).text())).toBe(7)
  })
})
