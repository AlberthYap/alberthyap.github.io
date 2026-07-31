import { ref } from 'vue'

/**
 * useCountUp — requestAnimationFrame-driven number counter.
 *
 * Animates from 0 → target over `duration` ms with easeOutCubic easing.
 * Returns a reactive `count` ref and `animate()` / `reset()` controls.
 * Use `decimals` to preserve fixed decimal places (e.g. 99.99).
 *
 * SSR-safe — no DOM access; purely computational.
 */
export function useCountUp(
  target: number,
  duration: number = 2000,
  decimals: number = 0,
) {
  const count = ref(0)
  const isAnimating = ref(false)
  let rafId: number | null = null

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  function animate(): void {
    if (isAnimating.value) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      count.value = target
      return
    }

    isAnimating.value = true
    const startTime = performance.now()

    function update(currentTime: number): void {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      count.value = parseFloat((target * eased).toFixed(decimals))

      if (progress < 1) {
        rafId = requestAnimationFrame(update)
      } else {
        count.value = target
        isAnimating.value = false
        rafId = null
      }
    }

    rafId = requestAnimationFrame(update)
  }

  function reset(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    count.value = 0
    isAnimating.value = false
  }

  return { count, animate, reset, isAnimating }
}
