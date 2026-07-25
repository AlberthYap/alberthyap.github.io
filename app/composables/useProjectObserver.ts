import {
  onBeforeUnmount,
  onMounted,
  ref,
  type InjectionKey,
  type Ref,
  inject,
  provide,
} from 'vue'

/**
 * useProjectObserver — Per-card scroll-spy for the projects section.
 *
 * Tracks which `[data-project-marker]` element currently dominates the
 * viewport via a single `IntersectionObserver` with `threshold: 0.5`.
 * The composable is intentionally SEPARATE from
 * `useActiveSection` (which tracks page-level macro sections). Reasons:
 *
 *   • Different threshold — "current card" needs ≥50% visibility so the
 *     reader has fully moved into it; macro-section "current band" sits
 *     at the middle ~5% of the viewport.
 *   • Different selector — per-card markers carry `data-project-marker`
 *     while macro sections carry `data-section-id`.
 *   • Different cadence — per-card updates need a trailing debounce
 *     (trackpad scrolling fires a flurry of batched entries that would
 *     flicker the counter without buffering).
 *
 * The composable returns:
 *   • `current` (Ref<number>) — 1-based index of the currently
 *     dominant card. `0` until the first observation fires; `current`
 *     holds the previous value when the IO batch reports no
 *     intersecting entries (sticky fallback so the counter doesn't
 *     flicker into "00 / 03" mid-scroll).
 *   • `total` (Ref<number>) — total count of cards observed.
 *   • `observed` (Ref<string[]>) — slugs in DOM order, useful for
 *     debugging / future templates that need direct slug routing.
 *
 * SSR-safe: the IO is built inside `onMounted`. Server renders the
 * initial state (current=0, total=0); the client picks the first
 * intersect immediately after hydration.
 *
 * Reduced-motion: not handled — the counter just updates a number;
 * no animation to collapse.
 */

export interface ProjectObserverContext {
  current: Ref<number>
  total: Ref<number>
  observed: Ref<string[]>
}

const KEY = Symbol('useProjectObserver') as InjectionKey<ProjectObserverContext>

/**
 * Trailing-edge debounce window for current-index updates. Long enough
 * that a trackpad-fire burst (4-7 batched entries over 30-80 ms) settles
 * into one final assignment; short enough that the counter still feels
 * responsive on deliberate trackpad scrolls (next assignment lands within
 * 60 ms of the last batch).
 */
const DEBOUNCE_MS = 60

export function useProjectObserver(
  selector = '[data-project-marker]',
): ProjectObserverContext {
  const current = ref<number>(0)
  const total = ref<number>(0)
  const observed = ref<string[]>([])

  let observer: IntersectionObserver | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Tracks the last id we'd commit. The IO callback may receive a
  // batch where multiple markers flip state in the same frame — the
  // debounce coalesces them into one final write so `current` only
  // changes once per scroll burst rather than flicking per frame.
  let pendingIdx: number | null = null

  function flush(): void {
    if (pendingIdx !== null && current.value !== pendingIdx) {
      current.value = pendingIdx
    }
    pendingIdx = null
    debounceTimer = null
  }

  function schedule(idx: number): void {
    pendingIdx = idx
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(flush, DEBOUNCE_MS)
  }

  onMounted(() => {
    const markers = Array.from(
      document.querySelectorAll(selector),
    ) as HTMLElement[]

    observed.value = markers
      .map((el) => el.getAttribute('data-project-slug') ?? '')
      .filter((slug) => slug.length > 0)

    total.value = markers.length

    if (markers.length === 0) return

    // While reading top→bottom, the LOWEST DOM-order index that has
    // crossed the 0.5 visibility threshold is the "current" card —
    // the one the reader is reading now. Scrolling back up flips the
    // smallest index back below 0.5; whatever settles at the new
    // "smallest fully-visible index" is the new "current".
    observer = new IntersectionObserver(
      (entries) => {
        let candidateIdx: number | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const idx = markers.indexOf(entry.target as HTMLElement)
          if (idx === -1) continue
          if (candidateIdx === null || idx < candidateIdx) {
            candidateIdx = idx
          }
        }
        if (candidateIdx !== null) {
          schedule(candidateIdx + 1)
        }
      },
      { threshold: 0.5, rootMargin: '0px' },
    )
    markers.forEach((el) => observer?.observe(el))
  })

  onBeforeUnmount(() => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    observer?.disconnect()
    observer = null
  })

  return { current, total, observed }
}

/**
 * Wrapper that calls `useProjectObserver(...)` AND `provide`s the result
 * under the project's injection key. Use in `pages/index.vue`. All the
 * active state is shared via Vue's reactive provide/inject — the
 * templates that consume `current` / `total` don't re-attach observers.
 */
export function useProvideProjectObserver(
  selector = '[data-project-marker]',
): ProjectObserverContext {
  const ctx = useProjectObserver(selector)
  provide(KEY, ctx)
  return ctx
}

/**
 * Inject the project observer context. Falls back to an inert stub
 * (zero-state refs, no IO) if no provider is mounted. Useful for
 * components rendered elsewhere (footer, sidebar) that want to show
 * the counter without breaking if the page doesn't provide one.
 */
export function useInjectProjectObserver(): ProjectObserverContext {
  const ctx = inject(KEY, null)
  if (ctx === null) {
    return {
      current: ref<number>(0) as Ref<number>,
      total: ref<number>(0) as Ref<number>,
      observed: ref<string[]>([]) as Ref<string[]>,
    }
  }
  return ctx
}
