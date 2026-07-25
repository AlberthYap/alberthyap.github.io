import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * useSectionReveal — Per-section IntersectionObserver orchestrator.
 *
 * Replaces the old `useIntroSequence` (one-shot setTimeout timeline) with
 * a single page-level `IntersectionObserver` that watches every element
 * carrying a `data-section-id="…"` attribute. When such an element enters
 * the viewport (threshold: 0.15, rootMargin: -80px 0px so the trigger fires
 * shortly after the section's anchor is well inside the reading column),
 * the section's id is added to a reactive `revealed` Set; templates bind
 * `:class="{ 'is-revealed': reveal.isRevealed(id) }"` on their wrappers
 * and the existing `[data-stagger]` cascade runs the inner beats.
 *
 * Design notes:
 * • State lives INSIDE the composable invocation (not module-level), so
 *   each request / component instance has its own `revealed` Set and
 *   observer. Tests do not need a `__resetForTests()` escape hatch; a
 *   fresh `mount()` of the test harness produces a clean slate.
 * • SSR-safe: `onMounted` is client-only, so the observer never runs on
 *   the server. SSR HTML renders wrappers with no `is-revealed` → opacity 0
 *   per the existing `.reveal-up` defaults — no flash of content above
 *   the fold without animation acceptance.
 * • Reduced motion: detected once at mount. If true, all known sections
 *   are revealed synchronously; the `prefers-reduced-motion` media query
 *   in `main.css` also collapses the animation itself to instant.
 * • Escape / skip: `skip()` and `onKeydown(Escape)` both call `revealAll()`
 *   which dumps every registered id into the `revealed` Set. The skip
 *   button in `pages/index.vue` mirrors this for non-keyboard users.
 *   Setting `data-intro-complete="true"` on the route wrapper flips a
 *   CSS override that suppresses any pending reveal animation, so hitt-
 *   ing Skip mid-flight gives an instant collapse rather than a half-
 *   finished fade.
 */

const IO_OPTIONS: IntersectionObserverInit = {
  threshold: 0.15,
  rootMargin: '-80px 0px',
}

export function useSectionReveal() {
  // Reactive Set of section ids that have entered the viewport. Sets do not
  // reactively track `.add()` mutations in Vue 3, so every add reassigns
  // the ref to a fresh Set (see `markRevealed`).
  const revealed = ref(new Set<string>())

  /** Section ids observed at mount. Fixed once `onMounted` runs. */
  const allIds = ref<string[]>([])

  /** OS-level reduced-motion preference, captured at mount. */
  const reducedMotion = ref(false)

  let observer: IntersectionObserver | null = null
  let boundKeydown: ((e: KeyboardEvent) => void) | null = null

  function detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function markRevealed(id: string): void {
    if (revealed.value.has(id)) return
    const next = new Set(revealed.value)
    next.add(id)
    revealed.value = next
  }

  function revealAll(): void {
    if (allIds.value.length === 0) return
    revealed.value = new Set(allIds.value)
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return
    event.preventDefault()
    revealAll()
  }

  onMounted(() => {
    reducedMotion.value = detectReducedMotion()

    // Resolve `[data-section-id]` elements FIRST so `allIds.value` is
    // populated regardless of which branch we take. The reduced-motion
    // path then calls `revealAll()` after `allIds` is non-empty (its
    // early-return guard otherwise silently no-ops); the normal IO path
    // attaches the observer to those same elements.
    const elements = Array.from(
      document.querySelectorAll('[data-section-id]'),
    ) as HTMLElement[]
    allIds.value = elements
      .map((el) => el.getAttribute('data-section-id'))
      .filter((id): id is string => id !== null)

    if (reducedMotion.value) {
      // OS-level a11y opt-out: reveal synchronously; media-query CSS in
      // main.css also collapses the actual animation to instant.
      revealAll()
      return
    }

    if (elements.length === 0) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.getAttribute('data-section-id')
          if (id === null || revealed.value.has(id)) continue
          markRevealed(id)
          // Stop tracking after first reveal; sections never re-hide.
          observer?.unobserve(entry.target)
        }
      },
      IO_OPTIONS,
    )
    elements.forEach((el) => observer?.observe(el))

    boundKeydown = onKeydown
    window.addEventListener('keydown', boundKeydown)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
    if (boundKeydown !== null) {
      window.removeEventListener('keydown', boundKeydown)
      boundKeydown = null
    }
  })

  /**
   * Template binding helper — returns a `ComputedRef<boolean>` for the
   * given section id. Call once per section in `<script setup>` so Vue
   * tracks each id independently; the returned Computed stays reactive
   * after `revealed.value` is reassigned.
   */
  function isRevealed(id: string) {
    return computed(() => revealed.value.has(id))
  }

  const allRevealed = computed(
    () => allIds.value.length > 0 && revealed.value.size === allIds.value.length,
  )

  const playing = computed(
    () =>
      !reducedMotion.value &&
      allIds.value.length > 0 &&
      revealed.value.size < allIds.value.length,
  )

  const progress = computed(() =>
    allIds.value.length === 0 ? 1 : revealed.value.size / allIds.value.length,
  )

  function skip(): void {
    revealAll()
  }

  return {
    isRevealed,
    allRevealed,
    playing,
    reducedMotion,
    progress,
    skip,
    /**
     * Escape handler — bound by the composable to `window` in `onMounted`
     * for the always-on shortcut, and exposed here so tests / future
     * programmatic use (e.g. wiring to a `Button` outside `window`) can
     * dispatch the same prevent-default + reveal-all semantics.
     */
    onKeydown,
  }
}
