import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import RegexTesterTool from '~~/app/components/tools/RegexTesterTool.vue'

describe('RegexTesterTool — match, flags, errors', () => {
  it('renders empty initial state', () => {
    const wrapper = mount(RegexTesterTool)
    expect(wrapper.find('.output-empty').exists()).toBe(true)
    // The Copy matches button should be disabled with no matches
    const copyBtn = wrapper.findAll('.dtool__pill').find((b) => b.text().includes('Copy'))
    expect(copyBtn?.attributes('disabled')).toBeDefined()
  })

  it('matches text with global flag by default', async () => {
    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    await testArea.setValue('hello world hello')
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('hello')
    await nextTick()

    expect(wrapper.text()).toContain('2 matches')
    expect(wrapper.findAll('.regex-match-card').length).toBe(2)
  })

  it('captures groups and displays them', async () => {
    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    await testArea.setValue('abc 123 def 456')
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('(\\d+)')
    await nextTick()

    expect(wrapper.findAll('.regex-match-card').length).toBe(2)
    // Group 1 should show the digits
    const firstCard = wrapper.findAll('.regex-match-card')[0]
    expect(firstCard.text()).toContain('123')
  })

  it('highlights matches with <mark> in the preview', async () => {
    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    await testArea.setValue('one two three')
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('two')
    await nextTick()

    const highlight = wrapper.find('.regex-highlight')
    expect(highlight.exists()).toBe(true)
    expect(highlight.html()).toContain('<mark>two</mark>')
  })

  it('shows No matches when pattern does not match', async () => {
    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    await testArea.setValue('hello world')
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('xyz')
    await nextTick()

    expect(wrapper.text()).toContain('No matches')
  })

  it('shows error for invalid regex', async () => {
    const wrapper = mount(RegexTesterTool)
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('[unclosed')
    await nextTick()

    expect(wrapper.find('.regex-pattern-row + div').text()).toMatch(/unterminated|expected/i)
  })

  it('clicking a quick pattern fills the pattern input', async () => {
    const wrapper = mount(RegexTesterTool)
    const quickBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().trim() === 'Email')
    await quickBtn!.trigger('click')
    await nextTick()

    const input = wrapper.find<HTMLInputElement>('input[aria-label="Regex pattern"]')
    expect(input.element.value).toContain('@')
  })

  it('clear resets both inputs and hides results', async () => {
    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    await testArea.setValue('hello')
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('\\w+')
    await nextTick()

    expect(wrapper.findAll('.regex-match-card').length).toBeGreaterThan(0)

    const clearBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    await nextTick()

    expect((testArea.element as HTMLTextAreaElement).value).toBe('')
    expect((wrapper.find('input[aria-label="Regex pattern"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('.output-empty').exists()).toBe(true)
  })

  it('rejects oversized test text with an inline limit notice (H7)', async () => {
    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    // MAX_TEST_TEXT = 100_000 chars
    await testArea.setValue('a'.repeat(100_001))
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('a')
    await nextTick()

    expect(wrapper.find('.regex-highlight').exists()).toBe(false)
    expect(wrapper.text()).toContain('safety limit')
    expect(wrapper.text()).toContain('100 KB')
  })

  it('Copy matches button copies and shows Copied!', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    })

    const wrapper = mount(RegexTesterTool)
    const testArea = wrapper.find('textarea')
    await testArea.setValue('a b')
    const patternInput = wrapper.find('input[aria-label="Regex pattern"]')
    await patternInput.setValue('\\w')
    await nextTick()

    const copyBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Copy matches'))
    expect(copyBtn!.attributes('disabled')).toBeUndefined()
    await copyBtn!.trigger('click')
    await nextTick()

    expect(writeText).toHaveBeenCalled()
    expect(copyBtn!.text()).toContain('Copied!')
  })
})
