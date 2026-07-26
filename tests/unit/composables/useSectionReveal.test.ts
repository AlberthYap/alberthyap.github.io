import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { useSectionReveal } from '~~/app/composables/useSectionReveal'

// `useSectionReveal` runs inside happy-dom, which has no real
// IntersectionObserver. `FireOnObserveIO` fires `isIntersecting: true`
// synchronously per observed element so onMounted can settle without
// async races; `SilentIO` never fires so the skip/Escape paths can be
// exercised without an intersection.
class FireOnObserveIO {
  callback: IntersectionObserverCallback
  elements: Element[] = []
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
  }
  observe(el: Element): void {
    this.elements.push(el)
    this.callback(
      [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
  unobserve(el: Element): void {
    this.elements = this.elements.filter((e) => e !== el)
  }
  disconnect(): void {
    this.elements = []
  }
}

class SilentIO {
  callback: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
  }
  observe(): void { /* never fires */ }
  unobserve(): void { /* no-op */ }
  disconnect(): void { /* no-op */ }
}

let savedIO: typeof globalThis.IntersectionObserver
let savedMatchMedia: typeof window.matchMedia

beforeEach(() => {
  // Capture the previous IO/matchMedia at the START of every test so we
  // restore *that* test's baseline (not whatever the module was first
  // imported under — happy-dom has no IntersectionObserver at module load).
  savedIO = globalThis.IntersectionObserver
  savedMatchMedia = window.matchMedia
  globalThis.IntersectionObserver = FireOnObserveIO as unknown as typeof IntersectionObserver
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
})

afterEach(() => {
  // `attachTo: document.body` mounts components into the real DOM and
  // vue-test-utils does NOT clear them between tests. Without this reset,
  // stale `<section data-section-id="…">` nodes from the previous test
  // inflate `allIds.length` past the dedup'd `revealed` Set size and
  // break `allRevealed` (which compares the two counts).
  document.body.innerHTML = ''
  globalThis.IntersectionObserver = savedIO
  window.matchMedia = savedMatchMedia
  vi.restoreAllMocks()
})

function mountWithSections(sectionIds: readonly string[]) {
  // `attachTo: document.body` mounts the component INTO the real DOM tree
  // so `document.querySelectorAll('[data-section-id]')` inside
  // useSectionReveal's onMounted can resolve the elements we render.
  return mount(
    defineComponent({
      template:
        `<div>` +
        sectionIds
          .map((id) => `<section data-section-id="${id}"></section>`)
          .join('') +
        `</div>`,
      setup() {
        const reveal = useSectionReveal()
        const sectionRefs: Record<string, ReturnType<typeof reveal.isRevealed>> = {}
        for (const id of sectionIds) {
          sectionRefs[id] = reveal.isRevealed(id)
        }
        return { reveal, sectionRefs }
      },
    }),
    { attachTo: document.body },
  )
}

describe('useSectionReveal', () => {
  it('marks every section as revealed once IO fires intersecting', async () => {
    const wrapper = mountWithSections(['about', 'skills', 'experience'])
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick() // double-tick: mount + IO callback already-fired reactively
    expect(wrapper.vm.sectionRefs.about?.value).toBe(true)
    expect(wrapper.vm.sectionRefs.skills?.value).toBe(true)
    expect(wrapper.vm.sectionRefs.experience?.value).toBe(true)
  })

  it('reports allRevealed = true once every section has revealed', async () => {
    const wrapper = mountWithSections(['about', 'skills'])
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.allRevealed.value).toBe(true)
    expect(wrapper.vm.reveal.playing.value).toBe(false)
    expect(wrapper.vm.reveal.progress.value).toBe(1)
  })

  it('skip() reveals all sections synchronously even when IO is silent', async () => {
    globalThis.IntersectionObserver =
      SilentIO as unknown as typeof IntersectionObserver
    const wrapper = mountWithSections(['about', 'skills'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.allRevealed.value).toBe(false)
    wrapper.vm.reveal.skip()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.allRevealed.value).toBe(true)
    expect(wrapper.vm.sectionRefs.about?.value).toBe(true)
    expect(wrapper.vm.sectionRefs.skills?.value).toBe(true)
  })

  it('reduced-motion preference reveals all sections synchronously', async () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
    const wrapper = mountWithSections(['about', 'skills'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.reducedMotion.value).toBe(true)
    expect(wrapper.vm.reveal.allRevealed.value).toBe(true)
    // `playing` is `false` whenever reduced-motion collapses to final.
    expect(wrapper.vm.reveal.playing.value).toBe(false)
  })

  it('onKeydown("Escape") triggers revealAll and prevents default', async () => {
    globalThis.IntersectionObserver =
      SilentIO as unknown as typeof IntersectionObserver
    const wrapper = mountWithSections(['about'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.allRevealed.value).toBe(false)

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    wrapper.vm.reveal.onKeydown(event)
    // Sync: revealAll mutates the ref synchronously; one $nextTick flushes
    // the dependency chain (progress / allRevealed).
    await wrapper.vm.$nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.vm.reveal.allRevealed.value).toBe(true)
  })

  it('onKeydown with a non-Escape key is a no-op', async () => {
    globalThis.IntersectionObserver =
      SilentIO as unknown as typeof IntersectionObserver
    const wrapper = mountWithSections(['about'])
    await wrapper.vm.$nextTick()
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    wrapper.vm.reveal.onKeydown(event)
    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.vm.reveal.allRevealed.value).toBe(false)
  })

  it('progress reflects revealed fraction, starting at 0 then jumping to 1', async () => {
    globalThis.IntersectionObserver =
      SilentIO as unknown as typeof IntersectionObserver
    const wrapper = mountWithSections(['a', 'b', 'c'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.progress.value).toBe(0)
    wrapper.vm.reveal.skip()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reveal.progress.value).toBe(1)
  })

  it('per-instance state isolation: a second reveal starts clean', async () => {
    const first = mountWithSections(['a'])
    await first.vm.$nextTick()
    await first.vm.$nextTick()
    expect(first.vm.reveal.allRevealed.value).toBe(true)
    first.unmount()

    // Swap the IO mock BEFORE the second mount. `mount()` runs `onMounted`
    // synchronously, so a mock override after the mount is read by the
    // composable as the *next* call, not the one firing during mount.
    globalThis.IntersectionObserver =
      SilentIO as unknown as typeof IntersectionObserver
    const second = mountWithSections(['b'])
    await second.vm.$nextTick()
    expect(second.vm.reveal.allRevealed.value).toBe(false)
    expect(second.vm.sectionRefs.b?.value).toBe(false)
  })
})
