import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PageContainer from '~~/app/components/layout/PageContainer.vue'

describe('PageContainer', () => {
  it('renders slot content', () => {
    const wrapper = mount(PageContainer, {
      slots: { default: '<p>Hello world</p>' },
    })
    expect(wrapper.text()).toBe('Hello world')
  })

  it('renders as <div> by default', () => {
    const wrapper = mount(PageContainer)
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('renders as <section> when as="section"', () => {
    const wrapper = mount(PageContainer, { props: { as: 'section' } })
    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('renders as <article> when as="article"', () => {
    const wrapper = mount(PageContainer, { props: { as: 'article' } })
    expect(wrapper.element.tagName).toBe('ARTICLE')
  })

  it('applies default max-width token per DESIGN.md §5.1', () => {
    const wrapper = mount(PageContainer)
    expect(wrapper.classes().join(' ')).toContain('max-w-[1200px]')
  })

  it('applies narrow max-width for case-study reading column', () => {
    const wrapper = mount(PageContainer, { props: { width: 'narrow' } })
    expect(wrapper.classes().join(' ')).toContain('max-w-[720px]')
  })

  it('applies full-width variant (no max-width)', () => {
    const wrapper = mount(PageContainer, { props: { width: 'full' } })
    expect(wrapper.classes().join(' ')).toContain('max-w-none')
  })

  it('applies responsive horizontal padding tokens', () => {
    const wrapper = mount(PageContainer)
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('px-6')
    expect(classList).toContain('md:px-12')
    expect(classList).toContain('lg:px-16')
  })

  it('centers content via mx-auto', () => {
    const wrapper = mount(PageContainer)
    expect(wrapper.classes().join(' ')).toContain('mx-auto')
  })
})
