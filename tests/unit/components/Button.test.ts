import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Button from '~~/app/components/ui/Button.vue'

describe('Button', () => {
  it('renders default slot content as visible label', () => {
    const wrapper = mount(Button, {
      slots: { default: '<span>Submit form</span>' },
    })
    expect(wrapper.text()).toContain('Submit form')
  })

  it('renders as a native <button>', () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('defaults to type="button" so accidental submission inside forms is avoided', () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    expect((wrapper.element as HTMLButtonElement).type).toBe('button')
  })

  it('forwards type="submit" for form submission', () => {
    const wrapper = mount(Button, {
      props: { type: 'submit' },
      slots: { default: 'Save' },
    })
    expect((wrapper.element as HTMLButtonElement).type).toBe('submit')
  })

  it('emits click event on activation', async () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Disabled' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('applies primary variant classes by default', () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('bg-primary')
    expect(classList).toContain('text-white')
  })

  it('applies ghost variant classes when specified', () => {
    const wrapper = mount(Button, {
      props: { variant: 'ghost' },
      slots: { default: 'Click' },
    })
    expect(wrapper.classes().join(' ')).toContain('text-muted')
    expect(wrapper.classes().join(' ')).not.toContain('bg-primary')
  })

  it('applies large size (48 px) per DESIGN.md §7.1 when size="lg"', () => {
    const wrapper = mount(Button, {
      props: { size: 'lg' },
      slots: { default: 'Click' },
    })
    expect(wrapper.classes().join(' ')).toContain('h-12')
  })

  it('respects ariaLabel override', () => {
    const wrapper = mount(Button, {
      props: { ariaLabel: 'Submit form' },
      slots: { default: 'Click' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Submit form')
  })

  it('exposes focus-visible ring for keyboard navigation', () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('focus-visible:ring-primary')
  })
})
