import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import {
  useInjectProjectObserver,
  useProjectObserver,
  useProvideProjectObserver,
} from '~~/app/composables/useProjectObserver'

/**
 * Tests for the per-card scroll-spy composable.
 *
 * `useProjectObserver` attaches a single `IntersectionObserver` to
 * every `[data-project-marker]` element with `threshold: 0.5`. The
 * composable drives the sticky `01 / 03` counter on the projects
 * section header (see `pages/index.vue`).
 *
 * Mocking strategy — same `ManualIO` class used by
 * `useActiveSection.test.ts`. Exposes `fire(isIntersecting, target)`
 * so individual tests can drive the IO callback.
 *
 * Component pattern — `<div>` + `<section data-project-marker data-project-slug="...">` + `setup() { return { ctx } }`.
 * vue-test-utils compiles the template; `wrapper.vm.ctx` exposes the
 * composable's reactive state.
 */

let savedIO: typeof globalThis.IntersectionObserver

beforeEach(() => {
  savedIO = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = ManualIO as unknown as typeof IntersectionObserver
  vi.useFakeTimers()
  // Reset class-static last-instance pointer.
  ManualIO.last = null
})

afterEach(() => {
  document.body.innerHTML = ''
  globalThis.IntersectionObserver = savedIO
  ManualIO.last = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})

class ManualIO {
  static last: ManualIO | null = null
  callback: IntersectionObserverCallback
  elements: Element[] = []
  options: IntersectionObserverInit | undefined
  constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = cb
    this.options = options
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

type Ctx = ReturnType<typeof useProjectObserver>

function mountWithCards(specs: readonly { slug: string }[]) {
  return mount(
    defineComponent({
      template:
        `<div>` +
        specs
          .map((s) => `<article data-project-marker data-project-slug="${s.slug}"></article>`)
          .join('') +
        `</div>`,
      setup() {
        const ctx = useProjectObserver()
        return { ctx }
      },
    }),
    { attachTo: document.body },
  )
}

describe('useProjectObserver', () => {
  it('starts with current=0 and total populated before IO fires', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(0)
    expect(wrapper.vm.ctx.total.value).toBe(3)
    expect(wrapper.vm.ctx.observed.value).toEqual(['a', 'b', 'c'])
  })

  it('uses threshold 0.5 so partially-visible cards do not flip "current"', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }])
    await nextTick()
    // Verify the observer was constructed with the right threshold,
    // which is what precludes 50%-not-quite reads from firing.
    expect(ManualIO.last!.options?.threshold).toBe(0.5)
  })

  it('sets current=1 when the first card crosses 0.5 visibility', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
    await nextTick()
    const a = document.querySelector('[data-project-slug="a"]')!
    ManualIO.last!.fire(true, a)
    await nextTick()
    // Debounce window — flush timers so the commit lands.
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(1)
  })

  it('advances current to 3 as the reader scrolls through three cards', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
    await nextTick()
    const cards = Array.from(document.querySelectorAll('[data-project-marker]'))
    ManualIO.last!.fire(true, cards[0] as Element)
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(1)

    ManualIO.last!.fire(true, cards[1] as Element)
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(2)

    ManualIO.last!.fire(true, cards[2] as Element)
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(3)
  })

  it('coalesces a burst of batched entries into one commit (debounce anti-flicker)', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }, { slug: 'b' }])
    await nextTick()
    const cards = Array.from(document.querySelectorAll('[data-project-marker]'))
    // Burst: three entries fire within the debounce window. Without
    // the trailing debounce, current would briefly flip 0 → 1 → 2 → 1
    // and the sticky counter would flicker. With it: only the LAST
    // candidate commits after 60 ms of quiet.
    ManualIO.last!.fire(true, cards[0] as Element)
    vi.advanceTimersByTime(10)
    ManualIO.last!.fire(true, cards[1] as Element)
    vi.advanceTimersByTime(10)
    ManualIO.last!.fire(true, cards[0] as Element)
    // Sanity: nothing committed yet — timer hasn't elapsed.
    expect(wrapper.vm.ctx.current.value).toBe(0)
    vi.advanceTimersByTime(60)
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(1)
  })

  it('picks the lowest DOM-order intersecting card from a batch', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
    await nextTick()
    const cards = Array.from(document.querySelectorAll('[data-project-marker]'))
    // Batch fires both `a` and `b` as intersecting simultaneously;
    // the composable picks the lowest index (whether the reader is
    // seeing `a` left-edge fading out + `b` entering). `a` wins.
    ManualIO.last!.callback(
      [
        { isIntersecting: true, target: cards[1] as Element },
        { isIntersecting: true, target: cards[0] as Element },
      ] as unknown as IntersectionObserverEntry[],
      ManualIO.last as unknown as IntersectionObserver,
    )
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(1)
  })

  it('handles a page with zero project markers without throwing', async () => {
    document.body.innerHTML = ''
    expect(document.querySelectorAll('[data-project-marker]').length).toBe(0)

    const wrapper = mount(
      defineComponent({
        template: '<div></div>',
        setup() {
          const ctx = useProjectObserver()
          return { ctx }
        },
      }),
      { attachTo: document.body },
    )
    await nextTick()
    expect(wrapper.vm.ctx.current.value).toBe(0)
    expect(wrapper.vm.ctx.total.value).toBe(0)
  })

  it('disconnects the observer on unmount', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }])
    await nextTick()
    const disconnectSpy = vi.spyOn(ManualIO.last!, 'disconnect')
    wrapper.unmount()
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('clears the debounce timer on unmount (even when one is pending)', async () => {
    const wrapper = mountWithCards([{ slug: 'a' }])
    await nextTick()
    // Fire the IO so the debounce schedules a pending timer before
    // unmount runs. Without this priming, `clearTimeout` wouldn't be
    // called because the variadic `if (debounceTimer !== null)`
    // short-circuits when no schedule ever happened.
    const card = document.querySelector('[data-project-marker]')!
    ManualIO.last!.fire(true, card)
    // At this point pendingIdx=1 and a setTimeout is in flight. The
    // unmount below MUST clear it; otherwise Vue's reactive teardown
    // would leak the timer.
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})

describe('useProvideProjectObserver + useInjectProjectObserver', () => {
  it('exposes the same context to nested descendants via provide/inject', async () => {
    let injectedCtx: Ctx | null = null
    const SpyRoot = defineComponent({
      name: 'SpyRoot',
      components: {
        SpyChild: defineComponent({
          name: 'SpyChild',
          template: '<span></span>',
          setup() {
            injectedCtx = useInjectProjectObserver()
            return {}
          },
        }),
      },
      template: `<div>` +
        `<article data-project-marker data-project-slug="a"></article>` +
        `<article data-project-marker data-project-slug="b"></article>` +
        `<spy-child></spy-child></div>`,
      setup() {
        useProvideProjectObserver()
        return {}
      },
    })

    const wrapper = mount(SpyRoot, { attachTo: document.body })
    await nextTick()

    expect(injectedCtx).not.toBeNull()
    // Inject identity check: refs are SHARED, not copied.
    const rootFirstCard = document.querySelector('[data-project-slug="a"]')!
    ManualIO.last!.fire(true, rootFirstCard)
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(injectedCtx!.current.value).toBe(1)
    wrapper.unmount()
  })

  it('useInjectProjectObserver returns an inert stub when no provider mounted', () => {
    const wrapper = mount(
      defineComponent({
        template: '<div></div>',
        setup() {
          const ctx = useInjectProjectObserver()
          return { ctx }
        },
      }),
    )
    expect((wrapper.vm as unknown as { ctx: Ctx }).ctx.current.value).toBe(0)
    expect((wrapper.vm as unknown as { ctx: Ctx }).ctx.total.value).toBe(0)
    expect((wrapper.vm as unknown as { ctx: Ctx }).ctx.observed.value).toEqual([])
  })
})
