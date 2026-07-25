import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import {
  useActiveSection,
  useInjectActiveSection,
  useProvideActiveSection,
} from '~~/app/composables/useActiveSection'

/**
 * Tests for the per-section scroll-spy composable.
 *
 * `useActiveSection` attaches a single `IntersectionObserver` to every
 * `[data-section-id]` element with `rootMargin: '-40% 0px -55% 0px'`.
 *
 * Mocking strategy — `ManualIO` exposes `fire(isIntersecting, target)`
 * (and `callback(...)` for multi-entry batches) so individual tests can
 * drive the IO callback with whatever batch they want.
 *
 * Component pattern — same as `useSectionReveal.test.ts`:
 *   `template: '...'` + `setup() { return { ctx } }`
 * Vue's runtime compiler picks up the template; the returned object
 * exposes the composable's reactive state on `wrapper.vm.ctx`, so tests
 * can assert real state (`wrapper.vm.ctx.currentSectionId.value`)
 * rather than just absence-of-throw.
 */

let savedIO: typeof globalThis.IntersectionObserver

beforeEach(() => {
  savedIO = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = ManualIO as unknown as typeof IntersectionObserver
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
  // Reset class-static last-instance pointer. Without this the
  // `zero-element` test below can see the LAST `new ManualIO(...)` from
  // a previous test (whose `elements` reflect that prior mount, not the
  // current one).
  ManualIO.last = null
})

afterEach(() => {
  // `attachTo: document.body` mounts components into the real DOM and
  // vue-test-utils does NOT clear them between tests. Without this
  // reset, stale data-section-id nodes from the previous test bleed
  // into `document.querySelectorAll('[data-section-id]')` lookups in
  // the composable's onMounted.
  document.body.innerHTML = ''
  globalThis.IntersectionObserver = savedIO
  ManualIO.last = null
  vi.restoreAllMocks()
})

class ManualIO {
  static last: ManualIO | null = null
  callback: IntersectionObserverCallback
  elements: Element[] = []
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
    ManualIO.last = this
  }
  observe(el: Element): void {
    this.elements.push(el)
  }
  unobserve(el: Element): void {
    this.elements = this.elements.filter((e) => e !== el)
  }
  disconnect(): void {
    this.elements = []
  }
  fire(isIntersecting: boolean, target: Element): void {
    this.callback(
      [{ isIntersecting, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

type Ctx = ReturnType<typeof useActiveSection>

function mountWithSections(sectionIds: readonly string[]) {
  return mount(
    defineComponent({
      template:
        `<div>` +
        sectionIds
          .map((id) => `<section data-section-id="${id}"></section>`)
          .join('') +
        `</div>`,
      setup() {
        const ctx = useActiveSection()
        return { ctx }
      },
    }),
    { attachTo: document.body },
  )
}

describe('useActiveSection', () => {
  it('starts with currentSectionId = null before the IO fires', async () => {
    const wrapper = mountWithSections(['hero', 'about'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.ctx.currentSectionId.value).toBeNull()
    expect(wrapper.vm.ctx.observed.value).toEqual(['hero', 'about'])
  })

  it('sets currentSectionId to the section the IO reports as intersecting', async () => {
    const wrapper = mountWithSections(['hero', 'about', 'skills'])
    await wrapper.vm.$nextTick()
    const aboutEl = document.querySelector('[data-section-id="about"]')!
    ManualIO.last!.fire(true, aboutEl)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.ctx.currentSectionId.value).toBe('about')
  })

  it('picks the last intersecting entry from a batch (reader just moved into it)', async () => {
    const wrapper = mountWithSections(['hero', 'about', 'skills'])
    await wrapper.vm.$nextTick()
    const heroEl = document.querySelector('[data-section-id="hero"]')!
    const aboutEl = document.querySelector('[data-section-id="about"]')!
    // Batch reports BOTH intersecting; per the composable contract the
    // last intersecting entry wins — it's the section the reader just
    // moved into.
    ManualIO.last!.callback(
      [
        { isIntersecting: true, target: heroEl },
        { isIntersecting: true, target: aboutEl },
      ] as unknown as IntersectionObserverEntry[],
      ManualIO.last! as unknown as IntersectionObserver,
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.ctx.currentSectionId.value).toBe('about')
  })

  it('holds the last-known id when the IO batch reports no intersections', async () => {
    const wrapper = mountWithSections(['hero', 'about'])
    await wrapper.vm.$nextTick()
    const aboutEl = document.querySelector('[data-section-id="about"]')!
    ManualIO.last!.fire(true, aboutEl)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.ctx.currentSectionId.value).toBe('about')

    // Reader scrolls into a gap; the IO batch comes back with no
    // intersecting entries. The composable must NOT reset to null —
    // sticky fallback keeps the previous id so the navbar highlight
    // doesn't flicker.
    ManualIO.last!.fire(false, aboutEl)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.ctx.currentSectionId.value).toBe('about')
  })

  it('handles a page with zero data-section-id elements without throwing', async () => {
    // Empty page path — render a top-level <div> and verify the
    // composable's no-element branch runs cleanly. We assert against
    // the document state directly instead of poking at the IO mock's
    // `elements` (which would race against the static `last` pointer
    // when prior tests have populated it).
    document.body.innerHTML = ''
    expect(document.querySelectorAll('[data-section-id]').length).toBe(0)

    const wrapper = mount(
      defineComponent({
        template: '<div></div>',
        setup() {
          const ctx = useActiveSection()
          return { ctx }
        },
      }),
      { attachTo: document.body },
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.ctx.currentSectionId.value).toBeNull()
    expect(wrapper.vm.ctx.observed.value).toEqual([])
    // No ManualIO instance was constructed for this page (early-return
    // path in the composable), so `ManualIO.last` either stays null or
    // points to whichever mock a prior test created. The composable's
    // correctly-skipped observer wiring is what matters here.
  })

  it('disconnects the observer on unmount', async () => {
    const wrapper = mountWithSections(['hero'])
    await wrapper.vm.$nextTick()
    const spy = vi.spyOn(ManualIO.last!, 'disconnect')
    wrapper.unmount()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('useProvideActiveSection + useInjectActiveSection', () => {
  // Captures live inside the `beforeEach` scope so each test starts
  // from a clean slate — prevents the prior test from leaving stale
  // values that would mask a future test's regression.
  let providedCtx: Ctx | null = null
  let injectedCtx: Ctx | null = null
  let SpyChild: ReturnType<typeof defineComponent>
  let SpyRoot: ReturnType<typeof defineComponent>

  beforeEach(() => {
    providedCtx = null
    injectedCtx = null
    SpyChild = defineComponent({
      name: 'SpyChild',
      template: '<span></span>',
      setup() {
        injectedCtx = useInjectActiveSection()
        return {}
      },
    })
    SpyRoot = defineComponent({
      name: 'SpyRoot',
      components: { SpyChild },
      template:
        `<div>` +
        `<section data-section-id="hero"></section>` +
        `<section data-section-id="about"></section>` +
        `<spy-child></spy-child></div>`,
      setup() {
        providedCtx = useProvideActiveSection()
        return {}
      },
    })
  })

  it('exposes the same context to nested descendants via provide/inject', async () => {
    const wrapper = mount(SpyRoot, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(providedCtx).not.toBeNull()
    expect(injectedCtx).not.toBeNull()
    // Identity check: the child's ctx IS the provider's ctx (same
    // reactive Refs, not a clone). `toBe` uses Object.is — reference
    // equality, not value equality.
    expect(injectedCtx!.currentSectionId).toBe(providedCtx!.currentSectionId)
    expect(injectedCtx!.observed).toBe(providedCtx!.observed)

    // Drive the IO from the same observer instance used in earlier
    // describe blocks; both views update through the shared ref.
    const heroEl = document.querySelector('[data-section-id="hero"]')!
    ManualIO.last!.fire(true, heroEl)
    await wrapper.vm.$nextTick()
    expect(providedCtx!.currentSectionId.value).toBe('hero')
    expect(injectedCtx!.currentSectionId.value).toBe('hero')
  })

  it('useInjectActiveSection returns an inert stub when no provider mounted', () => {
    // No `provide` ancestor — the inject falls through to an inert
    // stub. Mount just the consumer (no SpyRoot); the inject receives
    // the inert default.
    const wrapper = mount(
      defineComponent({
        template: '<div></div>',
        setup() {
          const ctx = useInjectActiveSection()
          return { ctx }
        },
      }),
    )
    expect((wrapper.vm as unknown as { ctx: Ctx }).ctx.currentSectionId.value).toBeNull()
    expect((wrapper.vm as unknown as { ctx: Ctx }).ctx.observed.value).toEqual([])
  })
})
