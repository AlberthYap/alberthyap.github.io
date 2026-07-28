/**
 * Hash-anchor click interceptor — tokenized smooth-scroll gate.
 *
 * Why a click listener (not Vue Router's scrollBehavior): the
 * browser fires its native hash-jump BEFORE Router's scrollBehavior
 * runs, so returning false from scrollBehavior suppresses Router's
 * own scroll but cannot un-jump the viewport. preventDefault at the
 * click level is the only place that fully prevents the native jump.
 */
import { useSmoothScroll } from '~/composables/useSmoothScroll'

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const smooth = useSmoothScroll()

  document.addEventListener('click', (event: MouseEvent) => {
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    // Modifier keys carry semantic intent — let the browser handle those.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    // Walk up to the nearest <a href="#..."> so nested spans/labels still count.
    const target = event.target
    if (!(target instanceof Element)) return
    const link = target.closest('a[href^="#"]') as HTMLAnchorElement | null
    if (!link) return

    const rawHref = link.getAttribute('href') ?? ''
    if (rawHref === '#' || rawHref === '') return

    const id = rawHref.slice(1)
    if (!id) return
    if (!document.getElementById(id)) return

    event.preventDefault()
    smooth.scrollToAnchor(id)

    // pushState (not hash = '#id') so Vue Router doesn't re-fire its scrollBehavior.
    if (window.location.hash !== rawHref) {
      window.history.pushState(null, '', rawHref)
    }
  })
})
