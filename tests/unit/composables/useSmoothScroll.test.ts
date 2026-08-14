import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSmoothScroll } from '~~/app/composables/useSmoothScroll'
describe('useSmoothScroll', () => {
  let rafQueue: Array<(t: number) => void> = []
  let origRaf: typeof window.requestAnimationFrame
  let origMatchMedia: typeof window.matchMedia

  function stubMatchMedia(reduce: boolean): void {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia
  }

  beforeEach(() => {
    rafQueue = []
    origRaf = window.requestAnimationFrame
    // Stub rAF to a deterministic queue so the ramp stays synchronous and order-deterministic.
    window.requestAnimationFrame = vi.fn((cb: (t: number) => void) => {
      rafQueue.push(cb)
      return rafQueue.length
    }) as typeof window.requestAnimationFrame

    origMatchMedia = window.matchMedia
    stubMatchMedia(false)

    // Pin via inline style so we can assert exact ms (the @theme default is happy-dom-fragile).
    document.documentElement.style.setProperty('--motion-scroll', '280ms')
  })

  afterEach(() => {
    window.requestAnimationFrame = origRaf
    window.matchMedia = origMatchMedia
    document.documentElement.style.removeProperty('--motion-scroll')
    vi.restoreAllMocks()
  })

  describe('durationMs', () => {
    it('parses ms-form token ("280ms" → 280)', () => {
      const smooth = useSmoothScroll()
      expect(smooth.durationMs()).toBe(280)
    })

    it('parses s-form token ("0.5s" → 500)', () => {
      document.documentElement.style.setProperty('--motion-scroll', '0.5s')
      const smooth = useSmoothScroll()
      expect(smooth.durationMs()).toBe(500)
    })

    it('parses unitless numeric as ms ("400" → 400)', () => {
      document.documentElement.style.setProperty('--motion-scroll', '400')
      const smooth = useSmoothScroll()
      expect(smooth.durationMs()).toBe(400)
    })

    it('returns 0 when the token is missing', () => {
      document.documentElement.style.removeProperty('--motion-scroll')
      const smooth = useSmoothScroll()
      expect(smooth.durationMs()).toBe(0)
    })

    it('returns 0 when the token is unparseable', () => {
      document.documentElement.style.setProperty('--motion-scroll', 'abc')
      const smooth = useSmoothScroll()
      expect(smooth.durationMs()).toBe(0)
    })

    it('clamps absurd values to the [0, 2000] safety range', () => {
      document.documentElement.style.setProperty('--motion-scroll', '60000ms')
      const smooth = useSmoothScroll()
      expect(smooth.durationMs()).toBe(2000)
    })
  })

  describe('prefersReducedMotion', () => {
    it('returns false when no preference is set', () => {
      const smooth = useSmoothScroll()
      expect(smooth.prefersReducedMotion()).toBe(false)
    })

    it('returns true when prefers-reduced-motion: reduce is set', () => {
      stubMatchMedia(true)
      const smooth = useSmoothScroll()
      expect(smooth.prefersReducedMotion()).toBe(true)
    })
  })

  describe('scrollToPosition', () => {
    it('instant-scrolls when prefers-reduced-motion is set (no rAF scheduled)', () => {
      stubMatchMedia(true)
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)

      const smooth = useSmoothScroll()
      smooth.scrollToPosition(500)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({ top: 500, behavior: 'auto' })
      expect(rafQueue).toHaveLength(0)
    })

    it('instant-scrolls when the duration token resolves to 0', () => {
      document.documentElement.style.removeProperty('--motion-scroll')
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)

      const smooth = useSmoothScroll()
      smooth.scrollToPosition(500)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({ top: 500, behavior: 'auto' })
    })

    it('schedules a rAF ramp and uses behavior: "auto" per frame', () => {
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)

      const smooth = useSmoothScroll()
      smooth.scrollToPosition(500)

      // Caller defers the first paint until the first rAF fires.
      expect(rafQueue).toHaveLength(1)

      // Step past the duration so t clamps to 1 and the final frame fires.
      const start = performance.now()
      while (rafQueue.length > 0) {
        const next = rafQueue.shift()!
        next(start + 280)
      }

      expect(spy.mock.calls.length).toBeGreaterThan(0)
      // Every frame MUST use behavior: 'auto' so the browser doesn't layer its smooth-glide underneath ours.
      for (const [arg] of spy.mock.calls) {
        expect(arg).toMatchObject({ behavior: 'auto' })
      }
      const lastCall = spy.mock.calls.at(-1)?.[0] as ScrollToOptions
      expect(lastCall.top).toBe(500)
    })

    it('is a no-op when the requested Y equals current scrollY', () => {
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(500)

      const smooth = useSmoothScroll()
      smooth.scrollToPosition(500)

      expect(spy).not.toHaveBeenCalled()
      expect(rafQueue).toHaveLength(0)
    })
  })

  describe('scrollToAnchor', () => {
    it('scrolls to the resolved element using its bounding-rect top', () => {
      const el = document.createElement('div')
      el.id = 'hero'
      document.body.appendChild(el)

      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
      // Anchor sits 800px below the viewport top.
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 800,
        left: 0,
        right: 0,
        bottom: 800,
        width: 0,
        height: 0,
        x: 0,
        y: 800,
        toJSON: () => ({}),
      } as DOMRect)

      const smooth = useSmoothScroll()
      smooth.scrollToAnchor('hero')

      // Drive any queued rAF to completion so the final frame lands.
      const start = performance.now()
      while (rafQueue.length > 0) {
        const next = rafQueue.shift()!
        next(start + 280)
      }

      const lastCall = spy.mock.calls.at(-1)?.[0] as ScrollToOptions
      expect(lastCall.top).toBe(800)
      expect(lastCall.behavior).toBe('auto')

      document.body.removeChild(el)
    })

    it('strips a leading "#" from the id', () => {
      const el = document.createElement('div')
      el.id = 'about'
      document.body.appendChild(el)

      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 120,
        left: 0,
        right: 0,
        bottom: 120,
        width: 0,
        height: 0,
        x: 0,
        y: 120,
        toJSON: () => ({}),
      } as DOMRect)

      const smooth = useSmoothScroll()
      smooth.scrollToAnchor('#about')

      const start = performance.now()
      while (rafQueue.length > 0) {
        const next = rafQueue.shift()!
        next(start + 280)
      }

      const lastCall = spy.mock.calls.at(-1)?.[0] as ScrollToOptions
      expect(lastCall.top).toBe(120)

      document.body.removeChild(el)
    })

    it('is a no-op when the id does not resolve to an element', () => {
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const smooth = useSmoothScroll()
      smooth.scrollToAnchor('does-not-exist')

      expect(spy).not.toHaveBeenCalled()
      expect(rafQueue).toHaveLength(0)
    })

    it('subtracts the element\'s scroll-margin-top so the ramp lands below the navbar (not at viewport y=0)', () => {
      // Mirrors the CSS `[id="hero|about|skills|experience|projects"] { scroll-margin-top: calc(...) }` rule.
      // 96 px = --spacing-navbar-height (80) + --spacing-4 (16); update together if either token changes.
      const el = document.createElement('div')
      el.id = 'about'
      el.style.scrollMarginTop = '96px'
      document.body.appendChild(el)

      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 800,
        left: 0,
        right: 0,
        bottom: 800,
        width: 0,
        height: 0,
        x: 0,
        y: 800,
        toJSON: () => ({}),
      } as DOMRect)

      const smooth = useSmoothScroll()
      smooth.scrollToAnchor('about')

      const start = performance.now()
      while (rafQueue.length > 0) {
        const next = rafQueue.shift()!
        next(start + 280)
      }

      // 800 (natural) - 96 (margin) = 704; lands 96 px below viewport top, NOT at y=0 under the pill.
      const lastCall = spy.mock.calls.at(-1)?.[0] as ScrollToOptions
      expect(lastCall.top).toBe(800 - 96)

      document.body.removeChild(el)
    })

    it('treats a missing/invalid scroll-margin-top as zero (no offset subtracted)', () => {
      const el = document.createElement('div')
      el.id = 'hero'
      // Pin to "0px" so the test doesn't rely on browser-default normalisation of an unset value.
      el.style.scrollMarginTop = '0px'
      document.body.appendChild(el)

      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 500,
        left: 0,
        right: 0,
        bottom: 500,
        width: 0,
        height: 0,
        x: 0,
        y: 500,
        toJSON: () => ({}),
      } as DOMRect)

      const smooth = useSmoothScroll()
      smooth.scrollToAnchor('hero')

      const start = performance.now()
      while (rafQueue.length > 0) {
        const next = rafQueue.shift()!
        next(start + 280)
      }

      const lastCall = spy.mock.calls.at(-1)?.[0] as ScrollToOptions
      expect(lastCall.top).toBe(500)

      document.body.removeChild(el)
    })
  })

  describe('re-entrancy', () => {
    it('cancels the in-flight ramp when a newer ramp starts', () => {
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      // Older ramp captured scrollY=0, newer captures scrollY=200.
      vi.spyOn(window, 'scrollY', 'get')
        .mockReturnValueOnce(0)
        .mockReturnValue(200)

      const smooth = useSmoothScroll()
      smooth.scrollToPosition(800)  // older ramp
      smooth.scrollToPosition(500)  // newer ramp — cancels older

      expect(rafQueue).toHaveLength(2)

      const start = performance.now()
      const olderStep = rafQueue.shift()!
      olderStep(start + 50)
      // Older step bailed (myId !== latestRampId) — no scrollTo fired.
      const callsAfterOlderStep = spy.mock.calls.length

      const newerStep = rafQueue.shift()!
      while (true) {
        newerStep(start + 500)  // far past duration; clamps to t=1
        if (spy.mock.calls.length > callsAfterOlderStep) break
      }

      // Newer ramp's destination (500) wins, not the older's (800).
      const lastCall = spy.mock.calls.at(-1)?.[0] as ScrollToOptions
      expect(lastCall.top).toBe(500)
    })
  })
})
