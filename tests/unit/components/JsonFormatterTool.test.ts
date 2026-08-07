import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import JsonFormatterTool from '~~/app/components/tools/JsonFormatterTool.vue'

const VALID_JSON = JSON.stringify({
  name: 'Test',
  items: [1, 2, 3],
  nested: { key: 'value' },
})

const INVALID_JSON = '{ name: Test, broken: true'

describe('JsonFormatterTool — format, minify, validate', () => {
  it('renders empty state with Format button disabled', () => {
    const wrapper = mount(JsonFormatterTool)
    const btn = wrapper.find('.dtool__convert-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.output-empty').exists()).toBe(true)
  })

  it('formats valid JSON with 2-space indent', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1,"b":[2,3]}')
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code')
    expect(output.exists()).toBe(true)
    // Should be multi-line with indentation
    expect(output.text()).toContain('\n')
    expect(output.text()).toContain('  ')
  })

  it('minifies pretty-printed JSON to single line', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{\n  "hello": "world"\n}')
    await nextTick()

    // Click Minify pill
    const pills = wrapper.findAll('.dtool__pill')
    const minifyBtn = pills.find(b => b.text().includes('Minify'))
    expect(minifyBtn).toBeTruthy()
    await minifyBtn!.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code')
    expect(output.exists()).toBe(true)
    // Should be single line, no newlines
    const text = output.text()
    expect(text).not.toContain('\n')
    expect(text).toContain('"hello":"world"')
  })

  it('shows parse error for invalid JSON', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue(INVALID_JSON)
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    // Error UI should appear
    const errorText = wrapper.text()
    expect(errorText).toMatch(/Parse Error|Unexpected|expected/i)
  })

  it('validate mode shows success for valid JSON', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"valid": true}')
    await nextTick()

    // Click Validate seg button
    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const validateBtn = segBtns.find(b => b.text().trim() === 'Validate')
    expect(validateBtn).toBeTruthy()
    await validateBtn!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Valid JSON')
  })

  it('validate mode shows error for invalid JSON', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{broken')
    await nextTick()

    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const validateBtn = segBtns.find(b => b.text().trim() === 'Validate')
    await validateBtn!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toMatch(/Parse Error|Unexpected|expected/i)
  })

  it('clear resets everything', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1}')
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('.output-surface code').exists()).toBe(true)

    const pills = wrapper.findAll('.dtool__pill')
    const clearBtn = pills.find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    await nextTick()

    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    expect(wrapper.find('.output-empty').exists()).toBe(true)
  })

  it('loads sample data via Try sample button', async () => {
    const wrapper = mount(JsonFormatterTool)
    const sampleBtn = wrapper.find('.dtool__pill--primary')
    await sampleBtn.trigger('click')
    await nextTick()

    const textarea = wrapper.find('textarea')
    const value = (textarea.element as HTMLTextAreaElement).value
    expect(value).toContain('Alberth Yap')
    expect(value).toContain('Vue.js')

    // Should auto-format
    const output = wrapper.find('.output-surface code')
    expect(output.exists()).toBe(true)
  })

  it('sort keys alphabetically reorders object keys in output', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"zebra":1,"alpha":2,"mango":3}')
    await nextTick()

    // Toggle sort keys
    const sortCheckbox = wrapper.find('input[type="checkbox"]')
    await sortCheckbox.setValue(true)
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    const alphaPos = output.indexOf('"alpha"')
    const mangoPos = output.indexOf('"mango"')
    const zebraPos = output.indexOf('"zebra"')
    expect(alphaPos).toBeLessThan(mangoPos)
    expect(mangoPos).toBeLessThan(zebraPos)
  })

  it('sort keys also sorts nested objects', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"zz":{"b":1,"a":2},"aa":{"d":3,"c":4}}')
    await nextTick()

    const sortCheckbox = wrapper.find('input[type="checkbox"]')
    await sortCheckbox.setValue(true)
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output.indexOf('"aa"')).toBeLessThan(output.indexOf('"zz"'))
    // Nested keys sorted
    expect(output.indexOf('"a"')).toBeLessThan(output.indexOf('"b"'))
    expect(output.indexOf('"c"')).toBeLessThan(output.indexOf('"d"'))
  })

  it('indent selector changes output indentation', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1}')
    await nextTick()

    // Default is 2-space indent
    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()
    expect(wrapper.find('.output-surface code').text()).toContain('  "a"')

    // Switch to 4-space indent
    const fourBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().trim() === '4')
    expect(fourBtn).toBeTruthy()
    await fourBtn!.trigger('click')
    await formatBtn.trigger('click')
    await nextTick()
    expect(wrapper.find('.output-surface code').text()).toContain('    "a"')
  })

  it('Download button creates a downloadable file', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1}')
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    // Click Download
    const pills = wrapper.findAll('.dtool__pill')
    const downloadBtn = pills.find(b => b.text().includes('Download'))
    expect(downloadBtn).toBeTruthy()
    expect(downloadBtn!.attributes('disabled')).toBeUndefined()

    // Download without output should be disabled
    const clearBtn = pills.find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    await nextTick()
    const pillsAfter = wrapper.findAll('.dtool__pill')
    const downloadAfter = pillsAfter.find(b => b.text().includes('Download'))
    expect(downloadAfter!.attributes('disabled')).toBeDefined()
  })

  it('Copy button toggles to Copied after copy', async () => {
    // Mock clipboard API
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    })

    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1}')
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const pills = wrapper.findAll('.dtool__pill')
    const copyBtn = pills.find(b => b.text().includes('Copy'))
    await copyBtn!.trigger('click')
    await nextTick()

    expect(writeText).toHaveBeenCalled()
    expect(copyBtn!.text()).toContain('Copied!')
  })
})
