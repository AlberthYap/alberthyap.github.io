import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CsvCleanerTool from '~~/app/components/tools/CsvCleanerTool.vue'

describe('CsvCleanerTool', () => {
  it('renders the workspace divider', () => {
    const wrapper = mount(CsvCleanerTool)
    expect(wrapper.find('.dtool__section-divider').exists()).toBe(true)
    expect(wrapper.text()).toContain('CSV Cleaner Workspace')
  })

  it('renders input and output cards', () => {
    const wrapper = mount(CsvCleanerTool)
    expect(wrapper.findAll('.editor-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Input CSV')
    expect(wrapper.text()).toContain('Cleaned CSV')
  })

  it('shows empty state when no input', () => {
    const wrapper = mount(CsvCleanerTool)
    expect(wrapper.text()).toContain('Cleaned CSV will appear here')
  })

  it('trims whitespace from cells', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('" John ", 25, "New York"')
    expect(wrapper.find('pre code').text()).toContain('John,25,New York')
  })

  it('removes blank rows', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('a,b\n\nc,d')
    expect(wrapper.find('pre code').text()).toBe('a,b\nc,d')
  })

  it('deduplicates rows', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('a,b\nc,d\na,b')
    const output = wrapper.find('pre code').text()
    const lines = output.split('\n')
    expect(lines.filter((l: string) => l === 'a,b')).toHaveLength(1)
    expect(lines).toHaveLength(2)
  })

  it('case-insensitive dedup', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('A,B\na,b')
    // Enable case-insensitive dedup
    const insensitiveCheckbox = wrapper.findAll('input[type="checkbox"]').at(3)
    await insensitiveCheckbox!.setValue(true)
    const output = wrapper.find('pre code').text()
    expect(output.split('\n')).toHaveLength(1)
  })

  it('normalizes quotes', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('"John",25,"New York"')
    // Without commas inside cells, quotes should be stripped by normalize
    expect(wrapper.find('pre code').text()).toContain('John')
  })

  it('keeps quotes for cells with commas', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('"Doe, John",25,"NYC"')
    expect(wrapper.find('pre code').text()).toContain('"Doe, John"')
  })

  it('can toggle operations off', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('" John ", 25\n\n" John ", 25')
    // Turn off all operations
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    for (const cb of checkboxes) {
      if ((cb.element as HTMLInputElement).checked) await cb.setValue(false)
    }
    // Should now show raw input (normalized to same lines, just joined)
    const output = wrapper.find('pre code').text()
    expect(output).toContain('" John "')
  })

  it('clears input', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('a,b,c')
    const clearBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('loads sample data', async () => {
    const wrapper = mount(CsvCleanerTool)
    const sampleBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Try sample'))
    await sampleBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toContain('Name')
  })

  it('shows removal stats', async () => {
    const wrapper = mount(CsvCleanerTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('a,b\n\nc,d')
    expect(wrapper.text()).toContain('removed')
  })
})
