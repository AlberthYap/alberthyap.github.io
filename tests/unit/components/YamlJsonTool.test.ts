import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import YamlJsonTool from '~~/app/components/tools/YamlJsonTool.vue'

describe('YamlJsonTool', () => {
  it('renders the workspace divider', () => {
    const wrapper = mount(YamlJsonTool)
    expect(wrapper.find('.dtool__section-divider').exists()).toBe(true)
    expect(wrapper.text()).toContain('YAML ⇄ JSON Workspace')
  })

  it('renders input and output cards', () => {
    const wrapper = mount(YamlJsonTool)
    expect(wrapper.findAll('.editor-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Input YAML')
    expect(wrapper.text()).toContain('JSON output')
  })

  it('shows empty state when no input', () => {
    const wrapper = mount(YamlJsonTool)
    expect(wrapper.text()).toContain('Converted output will appear here')
  })

  it('converts YAML to JSON (default direction)', async () => {
    const wrapper = mount(YamlJsonTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('name: Ada\nrole: Engineer\nactive: true')
    const output = wrapper.find('pre code').text()
    const parsed = JSON.parse(output)
    expect(parsed).toEqual({ name: 'Ada', role: 'Engineer', active: true })
  })

  it('converts JSON to YAML after switching direction', async () => {
    const wrapper = mount(YamlJsonTool)
    const toYamlBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('JSON → YAML'))
    await toYamlBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"name":"Ada","skills":["math","programming"]}')
    const output = wrapper.find('pre code').text()
    expect(output).toContain('name: Ada')
    expect(output).toContain('- math')
    expect(output).toContain('- programming')
  })

  it('handles nested structures', async () => {
    const wrapper = mount(YamlJsonTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('server:\n  host: localhost\n  ports:\n    - 80\n    - 443')
    const parsed = JSON.parse(wrapper.find('pre code').text())
    expect(parsed.server.host).toBe('localhost')
    expect(parsed.server.ports).toEqual([80, 443])
  })

  it('shows an error for invalid YAML', async () => {
    const wrapper = mount(YamlJsonTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('a: [unclosed')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Could not convert')
  })

  it('shows an error for invalid JSON in JSON → YAML mode', async () => {
    const wrapper = mount(YamlJsonTool)
    const toYamlBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('JSON → YAML'))
    await toYamlBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{ nope')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('loads sample data', async () => {
    const wrapper = mount(YamlJsonTool)
    const sampleBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Try sample'))
    await sampleBtn!.trigger('click')
    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toContain('Ada')
  })

  it('clears input', async () => {
    const wrapper = mount(YamlJsonTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('a: 1')
    const clearBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('keeps input when switching direction and re-interprets it', async () => {
    const wrapper = mount(YamlJsonTool)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('name: Ada')
    expect(wrapper.find('pre code').text()).toContain('Ada')

    // Switch to JSON → YAML: the same input is invalid JSON, so an error shows.
    const toYamlBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('JSON → YAML'))
    await toYamlBtn!.trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('name: Ada')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
