/**
 * useSmoothScroll — tokenized smooth-scroll consumer.
 *
 * Reads duration from `--motion-scroll` on :root. Honours
 * prefers-reduced-motion and each element's scroll-margin-top, and
 * uses `behavior: 'auto'` per frame so the ramp drives the easing
 * manually (no browser-native smooth-glide stacking underneath).
 *
 * Re-entrancy guard: a module-scope ramp id lets a newer scroll
 * cancel an in-flight chain — without it two simultaneous ramps
 * would fight for window.scrollY each frame.
 */

// Active ramp id; checked per rAF step so a newer ramp cancels anything still in flight.
let latestRampId = 0

export function useSmoothScroll() {
  function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // Clamped to [0, 2000] so a typo can't trap users in a multi-second ramp.
  function durationMs(): number {
    if (typeof window === 'undefined') return 0
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--motion-scroll')
      .trim()
    if (!raw) return 0
    let ms: number
    if (raw.endsWith('ms')) ms = parseFloat(raw)
    else if (raw.endsWith('s')) ms = parseFloat(raw) * 1000
    else ms = parseFloat(raw)
    if (!Number.isFinite(ms)) return 0
    return Math.max(0, Math.min(2000, Math.round(ms)))
  }

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  function scrollToPosition(targetY: number): void {
    if (typeof window === 'undefined') return
    const reduced = prefersReducedMotion()
    const ms = durationMs()
    if (reduced || ms === 0) {
      window.scrollTo({ top: targetY, behavior: 'auto' })
      return
    }
    const startY = window.scrollY
    const distance = targetY - startY
    if (distance === 0) return
    const myId = ++latestRampId
    const t0 = performance.now()
    const step = (now: number): void => {
      if (myId !== latestRampId) return  // newer ramp took over
      const t = Math.min(1, (now - t0) / ms)
      window.scrollTo({
        top: startY + distance * easeOutCubic(t),
        behavior: 'auto',  // manual easing — must NOT stack with native smooth-glide
      })
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // Subtracts scroll-margin-top so the section lands below the floating pill,
  // mirroring what a browser-native hash-jump does.
  function scrollToAnchor(id: string): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return
    const cleanId = id.startsWith('#') ? id.slice(1) : id
    const el = document.getElementById(cleanId)
    if (!el) return
    const scrollMargin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const top = el.getBoundingClientRect().top + window.scrollY - scrollMargin
    scrollToPosition(top)
  }

  return {
    scrollToAnchor,
    scrollToPosition,
    durationMs,
    prefersReducedMotion,
  }
}
