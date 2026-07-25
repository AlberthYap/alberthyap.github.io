import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type InjectionKey,
  type Ref,
} from 'vue'

/**
 * useActiveSection — Per-section scroll-spy orchestrator.
 *
 * Tracks which `[data-section-id]` element currently dominates the
 * viewport's middle band via a single IntersectionObserver. Bound to a
 * Vue provide/inject key (`ACTIVE_SECTION_KEY`) so any descendant
 * component can read `currentSectionId` without re-attaching observers.
 *
 * IO configuration rationale:
 *   - `threshold: 0`         — fires on any visibility change (no
 *     "intersect ratio" needed; we only care about presence in the band).
 *   - `rootMargin: '-40% 0px -55% 0px'` — shrinks the IO root box so
 *     only the middle ~5% of the viewport counts as "active". A section
 *     whose body crosses that band is currently dominant; the navbar
 *     lights up the matching `<NuxtLink>`.
 *   - Single observer, shared with everyone — costs one observer total
 *     per page regardless of how many components subscribe.
 *
 * SSR-safe: state lives inside the composable and the IO is built only
 * inside `onMounted` (client-only). Server renders nothing active; the
 * client picks the first intercept immediately after hydration.
 *
 * Reduced-motion: not handled here — the CSS underline transition already
 * collapses to instant via the existing `prefers-reduced-motion` media
 * query in `main.css`. The JS path stays the same.
 */

const ACTIVE_SECTION_KEY = Symbol('useActiveSection') as InjectionKey<{
  currentSectionId: Ref<string | null>
  observed: Ref<string[]>
}>

const IO_OPTIONS: IntersectionObserverInit = {
  threshold: 0,
  rootMargin: '-40% 0px -55% 0px',
}

export function useActiveSection() {
  const currentSectionId = ref<string | null>(null)
  const observed = ref<string[]>([])

  // Tracks the last intersecting id seen by the IO. The IO callback may
  // receive entries in flush order, so we keep this as the "sticky"
  // fallback when the user scrolls between two sections and the active
  // band is momentarily in a gap.
  let lastIntersectingId: string | null = null

  let observer: IntersectionObserver | null = null

  function activate(id: string | null): void {
    if (currentSectionId.value === id) return
    currentSectionId.value = id
  }

  onMounted(() => {
    const elements = Array.from(
      document.querySelectorAll('[data-section-id]'),
    ) as HTMLElement[]

    observed.value = elements
      .map((el) => el.getAttribute('data-section-id'))
      .filter((id): id is string => id !== null)

    if (elements.length === 0) return

    observer = new IntersectionObserver(
      (entries) => {
        // Build a snapshot of "currently intersecting" ids from this batch.
        // When multiple entries fire (scroll crosses a threshold), pick the
        // LAST intersecting entry — it represents the section the reader
        // just moved into.
        let batchIntersecting: string | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.getAttribute('data-section-id')
          if (id !== null) {
            batchIntersecting = id
            lastIntersectingId = id
          }
        }
        if (batchIntersecting !== null) {
          activate(batchIntersecting)
        } else {
          // Batch had no intersecting entries (user scrolled into a gap).
          // Hold the last known so the navbar doesn't flicker to "empty".
          activate(lastIntersectingId)
        }
      },
      IO_OPTIONS,
    )
    elements.forEach((el) => observer?.observe(el))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    currentSectionId,
    observed,
  }
}

/**
 * Wrapper that calls `useActiveSection()` AND `provide`s the result
 * under `ACTIVE_SECTION_KEY`. Use this in the page-level component
 * (`pages/index.vue`); descendant components inject via
 * `useInjectActiveSection()`.
 */
export function useProvideActiveSection() {
  const ctx = useActiveSection()
  provide(ACTIVE_SECTION_KEY, ctx)
  return ctx
}

/**
 * Inject the page-level section-spy context. Falls back to an inert
 * stub (no observer wired up) if no provider is mounted — lets deep
 * components render defensively, e.g. inside Storybook stories or
 * tests where the harness doesn't include the page component.
 */
export function useInjectActiveSection() {
  const ctx = inject(ACTIVE_SECTION_KEY, null)
  if (ctx === null) {
    return {
      currentSectionId: ref<string | null>(null) as Ref<string | null>,
      observed: ref<string[]>([]) as Ref<string[]>,
    }
  }
  return ctx
}
