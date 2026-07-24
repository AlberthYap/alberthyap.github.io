import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Input from '~~/app/components/ui/Input.vue'

describe('Input', () => {
  it('renders the label paired with the input via for/id', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', label: 'Email address' },
    })
    const label = wrapper.find('label')
    const input = wrapper.find('input')
    expect(label.text()).toContain('Email address')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('updates modelValue on input (two-way binding via defineModel)', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', label: 'Email address' },
    })
    await wrapper.find('input').setValue('hello@example.com')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    // Guards against the duplicate-emit bug where manual `emit()` was added
    // alongside `defineModel`.
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]).toEqual(['hello@example.com'])
  })

  it('marks required with an asterisk and aria-required', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', label: 'Email address', required: true },
    })
    expect(wrapper.text()).toContain('*')
    expect(wrapper.find('input').attributes('aria-required')).toBe('true')
    expect((wrapper.find('input').element as HTMLInputElement).required).toBe(true)
  })

  it('shows error and announces it (role=alert + aria-invalid)', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'not-an-email',
        label: 'Email',
        error: 'Please enter a valid email address.',
      },
    })
    const error = wrapper.find('[role="alert"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toBe('Please enter a valid email address.')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('wires aria-describedby so error and hint are announced', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'foo',
        label: 'Email',
        hint: 'We will never spam you.',
        error: 'Invalid email',
      },
    })
    const describedBy = wrapper.find('input').attributes('aria-describedby')
    expect(describedBy).toBeTruthy()
    // Both hint and error ids should be referenced.
    expect(wrapper.find(`#${describedBy?.split(' ')[0]}`).exists()).toBe(true)
    expect(wrapper.find(`#${describedBy?.split(' ')[1]}`).exists()).toBe(true)
  })

  it('disables input and dims styling when disabled', () => {
    const wrapper = mount(Input, {
      props: { modelValue: 'value', label: 'Locked', disabled: true },
    })
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.find('input').classes().join(' ')).toContain('disabled:opacity-50')
  })

  it('forwards type prop to the underlying input', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', label: 'Password', type: 'password' },
    })
    expect((wrapper.find('input').element as HTMLInputElement).type).toBe('password')
  })

  it('exposes focus-visible ring for keyboard navigation', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', label: 'Email' },
    })
    expect(wrapper.find('input').classes().join(' '))
      .toContain('focus-visible:ring-primary')
  })
})
