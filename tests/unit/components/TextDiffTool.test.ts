import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TextDiffTool from '~~/app/components/tools/TextDiffTool.vue'

describe('TextDiffTool', () => {
  it('renders the workspace divider', () => {
    const wrapper = mount(TextDiffTool)
    expect(wrapper.text()).toContain('Diff Workspace')
  })

  it('renders two input textareas and diff output section', () => {
    const wrapper = mount(TextDiffTool)
    expect(wrapper.findAll('textarea')).toHaveLength(2)
    expect(wrapper.text()).toContain('Original')
    expect(wrapper.text()).toContain('Changed')
    expect(wrapper.text()).toContain('Diff')
  })

  it('shows empty state when no input', () => {
    const wrapper = mount(TextDiffTool)
    expect(wrapper.text()).toContain('Diff will appear here')
  })

  it('shows diff when both inputs have content', async () => {
    const wrapper = mount(TextDiffTool)
    const textareas = wrapper.findAll('textarea')
    await textareas[0]!.setValue('line a\nline b')
    await textareas[1]!.setValue('line a\nline c')
    const diff = wrapper.find('.diff-line--add')
    expect(diff.exists()).toBe(true)
  })

  it('highlights added and removed lines', async () => {
    const wrapper = mount(TextDiffTool)
    const textareas = wrapper.findAll('textarea')
    await textareas[0]!.setValue('hello\nworld')
    await textareas[1]!.setValue('hello\nearth')
    expect(wrapper.find('.diff-line--del').exists()).toBe(true)
    expect(wrapper.find('.diff-line--add').exists()).toBe(true)
    expect(wrapper.find('.diff-line--same').exists()).toBe(true)
  })

  it('swaps original and changed', async () => {
    const wrapper = mount(TextDiffTool)
    const textareas = wrapper.findAll('textarea')
    await textareas[0]!.setValue('AAA')
    await textareas[1]!.setValue('BBB')
    const swapBtn = wrapper.find('.dtool__seg-btn')
    await swapBtn.trigger('click')
    expect((textareas[0]!.element as HTMLTextAreaElement).value).toBe('BBB')
    expect((textareas[1]!.element as HTMLTextAreaElement).value).toBe('AAA')
  })

  it('loads sample data', async () => {
    const wrapper = mount(TextDiffTool)
    const sampleBtn = wrapper.findAll('.dtool__seg-btn').find(b => b.text().includes('Sample'))
    await sampleBtn!.trigger('click')
    const textareas = wrapper.findAll('textarea')
    expect((textareas[0]!.element as HTMLTextAreaElement).value).toContain('quick brown fox')
    expect((textareas[1]!.element as HTMLTextAreaElement).value).toContain('new line')
  })

  it('clears both inputs', async () => {
    const wrapper = mount(TextDiffTool)
    const textareas = wrapper.findAll('textarea')
    await textareas[0]!.setValue('AAA')
    await textareas[1]!.setValue('BBB')
    const clearBtn = wrapper.findAll('.dtool__pill').find(b => b.text().includes('Clear'))
    await clearBtn!.trigger('click')
    expect((textareas[0]!.element as HTMLTextAreaElement).value).toBe('')
    expect((textareas[1]!.element as HTMLTextAreaElement).value).toBe('')
  })

  it('shows diff stats', async () => {
    const wrapper = mount(TextDiffTool)
    const textareas = wrapper.findAll('textarea')
    await textareas[0]!.setValue('line a\nline b\nline c')
    await textareas[1]!.setValue('line a\nline x\nline c')
    expect(wrapper.text()).toContain('unchanged')
  })
})
