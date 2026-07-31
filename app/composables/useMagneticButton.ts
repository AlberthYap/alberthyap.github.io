import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * useMagneticButton — Subtle cursor-attraction hover for interactive elements.
 *
 * On `mousemove` the element translates slightly toward the cursor
 * (within a configurable range), and snaps back on `mouseleave`.
 * Strength/range control how pronounced the effect feels.
 *
 * Works with both native elements (`<button ref>`) and Vue component
 * refs (`<NuxtLink ref>`) by resolving `$el` when present.
 *
 * Reduced-motion aware — skips binding entirely when the OS flag is set.
 */
export function useMagneticButton(
  elementRef: Ref<HTMLElement | null>,
  strength: number = 0.3,
  range: number = 100,
) {
  /** Resolve the underlying DOM element — `$el` for component refs, direct for native. */
  function el(): HTMLElement | null {
    const v = elementRef.value
    if (!v) return null
    return ((v as any).$el as HTMLElement) ?? v
  }

  function handleMouseMove(e: MouseEvent): void {
    const target = el()
    if (!target) return
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const distance = Math.sqrt(x * x + y * y)

    if (distance < range) {
      const factor = (range - distance) / range
      target.style.transform =
        `translate(${x * factor * strength}px, ${y * factor * strength}px)`
    }
  }

  function handleMouseLeave(): void {
    const target = el()
    if (!target) return
    target.style.transform = 'translate(0, 0)'
  }

  onMounted(() => {
    const target = el()
    if (!target || typeof target.addEventListener !== 'function') return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    target.addEventListener('mousemove', handleMouseMove)
    target.addEventListener('mouseleave', handleMouseLeave)
  })

  onBeforeUnmount(() => {
    const target = el()
    if (!target || typeof target.removeEventListener !== 'function') return
    target.removeEventListener('mousemove', handleMouseMove)
    target.removeEventListener('mouseleave', handleMouseLeave)
  })
}
