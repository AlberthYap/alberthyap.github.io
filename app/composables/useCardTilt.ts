import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * useCardTilt — 3D perspective tilt + spotlight tracking for cards.
 *
 * On `mousemove` the card rotates slightly toward the cursor (Apple-style)
 * and sets `--mouse-x` / `--mouse-y` CSS custom properties so a
 * `::before` pseudo-element can render a radial-glow spotlight.
 * Snaps back to flat on `mouseleave`.
 *
 * Reduced-motion aware — skips binding when the OS flag is set.
 */
export function useCardTilt(cardRef: Ref<HTMLElement | null>) {
  function handleMouseMove(e: MouseEvent): void {
    if (!cardRef.value) return
    const rect = cardRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 12
    const rotateY = (centerX - x) / 12

    cardRef.value.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`
    cardRef.value.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`)
    cardRef.value.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`)
  }

  function handleMouseLeave(): void {
    if (!cardRef.value) return
    cardRef.value.style.transform =
      'perspective(1000px) rotateX(0) rotateY(0)'
    cardRef.value.style.removeProperty('--mouse-x')
    cardRef.value.style.removeProperty('--mouse-y')
  }

  onMounted(() => {
    if (!cardRef.value) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    cardRef.value.addEventListener('mousemove', handleMouseMove)
    cardRef.value.addEventListener('mouseleave', handleMouseLeave)
  })

  onBeforeUnmount(() => {
    cardRef.value?.removeEventListener('mousemove', handleMouseMove)
    cardRef.value?.removeEventListener('mouseleave', handleMouseLeave)
  })
}
