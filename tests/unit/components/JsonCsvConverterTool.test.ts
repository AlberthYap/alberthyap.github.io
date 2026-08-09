import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import JsonCsvConverterTool from '~~/app/components/tools/JsonCsvConverterTool.vue'

describe('JsonCsvConverterTool', () => {
  it('renders the workspace divider', () => {
    const wrapper = mount(JsonCsvConverterTool)
    expect(wrapper.find('.dtool__section-divider').exists()).toBe(true)
    expect(wrapper.text()).toContain('JSON ⇄ CSV Workspace')
  })

  it('renders input and output cards', () => {
    const wrapper = mount(JsonCsvConverterTool)
    expect(wrapper.findAll('.editor-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Input JSON')
    expect(wrapper.text()).toContain('CSV output')
  })

  it('shows empty state when no input', () => {
    const wrapper = mount(JsonCsvConverterTool)
    expect(wrapper.text()).toContain('Converted output will appear here')
  })

  it('converts JSON to CSV (default direction)', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('[{"name":"Ada","role":"Engineer"},{"name":"Grace","role":"Analyst"}]')
    const output = wrapper.find('pre code').text()
    expect(output.split('\n')[0]).toBe('name,role')
    expect(output).toContain('Ada,Engineer')
    expect(output).toContain('Grace,Analyst')
  })

  it('converts CSV to JSON after switching direction', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const toJsonBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('CSV → JSON'))
    await toJsonBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    await textarea.setValue('name,role\nAda,Engineer\nGrace,Analyst')
    const output = wrapper.find('pre code').text()
    const parsed = JSON.parse(output)
    expect(parsed).toHaveLength(2)
    expect(parsed[0]).toEqual({ name: 'Ada', role: 'Engineer' })
  })

  it('coerces numeric cells when parsing CSV', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const toJsonBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('CSV → JSON'))
    await toJsonBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    await textarea.setValue('age,city\n25,"New York"')
    const parsed = JSON.parse(wrapper.find('pre code').text())
    expect(parsed[0].age).toBe(25)
  })

  it('shows an error for invalid JSON', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{ not valid json')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Could not convert')
  })

  it('shows an error when JSON is not an array of objects', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('[1,2,3]')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('array of objects')
  })

  it('loads sample data', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const sampleBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Try sample'))
    await sampleBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toContain('Ada')
  })

  it('clears input', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('[]')
    const clearBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('keeps input when switching direction and re-interprets it', async () => {
    const wrapper = mount(JsonCsvConverterTool)
    const textarea = wrapper.find('textarea')
    // Start in CSV → JSON mode with valid CSV.
    const toJsonBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('CSV → JSON'))
    await toJsonBtn!.trigger('click')
    await textarea.setValue('name\nAda')
    const parsed = JSON.parse(wrapper.find('pre code').text())
    expect(parsed).toEqual([{ name: 'Ada' }])

    // Switch to JSON → CSV: the same input is invalid JSON, so an error shows.
    const toCsvBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('JSON → CSV'))
    await toCsvBtn!.trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('name\nAda')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
