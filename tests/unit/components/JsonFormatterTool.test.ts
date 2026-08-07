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

  it('Drop empty strips null, empty strings, arrays and objects', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"keep":1,"n":null,"s":"","arr":[],"obj":{},"nested":{"x":null,"y":"ok"}}')
    await nextTick()

    // Two checkboxes: Sort keys + Drop empty
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(2)
    await checkboxes[1].setValue(true)
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output).toContain('"keep"')
    expect(output).toContain('"nested"')
    expect(output).toContain('"y"')
    expect(output).not.toContain('"n"')
    expect(output).not.toContain('"s"')
    expect(output).not.toContain('"arr"')
    expect(output).not.toContain('"obj"')
    expect(output).not.toContain('"x"')
  })

  it('Drop empty also cleans values inside arrays', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"items":[1,null,"",{},3]}')
    await nextTick()

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[1].setValue(true)
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    // null, "" and {} removed from array; only 1 and 3 remain
    expect(output).toContain('1')
    expect(output).toContain('3')
    expect(output).not.toContain('null')
    expect(output).not.toContain('""')
  })

  it('shows stats strip with keys, nodes, depth and size', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1,"b":[1,2,3],"c":{"d":true}}')
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const stats = wrapper.find('.json-stats')
    expect(stats.exists()).toBe(true)
    const text = stats.text()
    expect(text).toContain('Keys')
    expect(text).toContain('Nodes')
    expect(text).toContain('Depth')
    expect(text).toContain('Size')
    // a, b, c, d = 4 keys; depth: root(1) > c > d = 3
    expect(text).toContain('4')
    expect(text).toContain('3')
  })

  it('renders line numbers matching output lines', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{\n  "a": 1,\n  "b": 2\n}')
    await nextTick()

    const formatBtn = wrapper.find('.dtool__convert-btn')
    await formatBtn.trigger('click')
    await nextTick()

    const gutter = wrapper.find('.line-gutter')
    expect(gutter.exists()).toBe(true)
    const numbers = gutter.findAll('span')
    expect(numbers.length).toBe(4)
    expect(numbers.map((s) => s.text()).join(',')).toBe('1,2,3,4')
  })

  it('Copy escaped copies output as a quoted string literal', async () => {
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
    const escapedBtn = pills.find((b) => b.text().includes('Escaped'))
    expect(escapedBtn).toBeTruthy()
    await escapedBtn!.trigger('click')
    await nextTick()

    expect(writeText).toHaveBeenCalledWith('"{\\n  \\"a\\": 1\\n}"')
  })

  it('Flatten mode converts nested keys to dot paths', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":{"b":1},"c":[1,2]}')
    await nextTick()

    // Click Flatten seg button
    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const flattenBtn = segBtns.find((b) => b.text().trim() === 'Flatten')
    expect(flattenBtn).toBeTruthy()
    await flattenBtn!.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output).toContain('"a.b"')
    expect(output).toContain('"c"')
    expect(output).not.toContain('"b"')
  })

  it('Unflatten mode restores nested keys', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a.b":1,"a.c.d":2}')
    await nextTick()

    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const unflattenBtn = segBtns.find((b) => b.text().trim() === 'Unflatten')
    await unflattenBtn!.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output).toContain('"a"')
    expect(output).toContain('"c"')
    expect(output).not.toContain('"a.b"')
  })

  it('To CSV mode converts a JSON array to CSV', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('[{"name":"Ada","age":36},{"name":"Grace","age":45}]')
    await nextTick()

    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const csvBtn = segBtns.find((b) => b.text().trim() === 'To CSV')
    await csvBtn!.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output).toContain('name,age')
    expect(output).toContain('Ada,36')
    expect(output).toContain('Grace,45')
  })

  it('To CSV mode shows error for non-array input', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"not":"array"}')
    await nextTick()

    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const csvBtn = segBtns.find((b) => b.text().trim() === 'To CSV')
    await csvBtn!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toMatch(/array of objects/i)
  })

  it('From CSV mode parses CSV back to formatted JSON', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('name,age\nAda,36\nGrace,45')
    await nextTick()

    const segBtns = wrapper.findAll('.dtool__seg-btn')
    const fromCsvBtn = segBtns.find((b) => b.text().trim() === 'From CSV')
    await fromCsvBtn!.trigger('click')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output).toContain('"name"')
    expect(output).toContain('"Ada"')
    expect(output).toContain('36')
  })

  it('Path filter drills into nested data', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"users":[{"name":"Ada"},{"name":"Grace"}]}')
    await nextTick()

    const pathInput = wrapper.find('#json-path')
    expect(pathInput.exists()).toBe(true)
    await pathInput.setValue('$.users[*].name')
    await nextTick()

    const output = wrapper.find('.output-surface code').text()
    expect(output).toContain('"Ada"')
    expect(output).toContain('"Grace"')
    expect(output).not.toContain('"users"')
  })

  it('Path filter shows inline error for bad paths', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"a":1}')
    await nextTick()

    const pathInput = wrapper.find('#json-path')
    await pathInput.setValue('.a[*]')
    await nextTick()

    expect(wrapper.text()).toMatch(/non-array|error/i)
  })

  it('Compare mode diffs two documents with add/remove counts', async () => {
    const wrapper = mount(JsonFormatterTool)

    // Toggle Compare mode
    const comparePill = wrapper.findAll('.dtool__pill').find((b) => b.text().includes('Compare'))
    expect(comparePill).toBeTruthy()
    await comparePill!.trigger('click')
    await nextTick()

    expect(wrapper.find('.compare-panel').exists()).toBe(true)
    expect(wrapper.find('.dtool__workspace').exists()).toBe(false)

    const textareas = wrapper.findAll('.compare-grid textarea')
    // JSON Lines input: B is A plus one extra line, so the diff is purely additive
    await textareas[0].setValue('{"a": 1}')
    await textareas[1].setValue('{"a": 1}\n{"b": 2}')
    await nextTick()

    const compareBtn = wrapper.findAll('.dtool__convert-btn').find((b) => b.text().trim() === 'Compare')
    await compareBtn!.trigger('click')
    await nextTick()

    expect(wrapper.find('.diff-surface').exists()).toBe(true)
    const diffLines = wrapper.findAll('.diff-line')
    expect(diffLines.length).toBeGreaterThan(0)
    const added = diffLines.filter((l) => l.classes().includes('diff-line--add'))
    const removed = diffLines.filter((l) => l.classes().includes('diff-line--del'))
    expect(added.length).toBe(1)
    expect(removed.length).toBe(0)
    expect(wrapper.text()).toMatch(/added/i)
  })

  it('renders line numbers in the input gutter matching input lines', async () => {
    const wrapper = mount(JsonFormatterTool)
    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('wrap')).toBe('off')

    await textarea.setValue('{\n  "a": 1,\n  "b": 2\n}')
    await nextTick()

    const gutter = wrapper.find('.input-gutter')
    expect(gutter.exists()).toBe(true)
    const numbers = gutter.findAll('span')
    expect(numbers.length).toBe(4)
    expect(numbers.map((s) => s.text()).join(',')).toBe('1,2,3,4')
  })

  it('input gutter shows at least one line when empty', () => {
    const wrapper = mount(JsonFormatterTool)
    const numbers = wrapper.find('.input-gutter').findAll('span')
    expect(numbers.length).toBe(1)
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
