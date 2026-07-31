import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * useParallax — Scroll-driven parallax translateY on a target element.
 *
 * Binds a passive scroll listener that offsets the element vertically
 * by `scrollY * speed`. Uses rAF throttling so it never fires more
 * than once per frame. Respects `prefers-reduced-motion` — when the
 * OS flag is set the composable is a no-op.
 */
export function useParallax(
  elementRef: Ref<HTMLElement | null>,
  speed: number = 0.4,
) {
  let ticking = false

  function update(): void {
    if (!elementRef.value) return
    const scrolled = window.scrollY
    elementRef.value.style.transform = `translateY(${scrolled * speed}px)`
    ticking = false
  }

  function onScroll(): void {
    if (!ticking) {
      requestAnimationFrame(update)
      ticking = true
    }
  }

  onMounted(() => {
    if (!elementRef.value) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
  })
}
