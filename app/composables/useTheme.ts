/**
 * Theme composable — 2-state preference (light / dark) with
 * localStorage persistence. Default follows device preference
 * via prefers-color-scheme on first visit.
 */
import { onMounted, ref } from 'vue'

export type ThemePref = 'light' | 'dark'

const STORAGE_KEY = 'theme-pref'

/** Shared state across components (module-level singletons in Vue/Nuxt). */
const pref = ref<ThemePref>('light')

function readStored(): ThemePref | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    // Only `'light'` and `'dark'` are honoured. Legacy `'system'` is
    // deliberately returned as `null` here so the migration path
    // below promotes it to an explicit 2-state value.
    return v === 'dark' || v === 'light' ? v : null
  } catch (error) {
    if (import.meta.dev) {
      console.warn('[useTheme] localStorage read failed:', error)
    }
    return null
  }
}

function writeStored(value: ThemePref): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* private mode / quota exceeded — fail silently */
  }
}

function applyToDocument(theme: ThemePref): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  function set(next: ThemePref): void {
    pref.value = next
    applyToDocument(next)
    writeStored(next)
  }

  // User-initiated swap kept distinct from set() so mount-path doesn't fire a transition on first paint.
  function swap(): void {
    const next: ThemePref = pref.value === 'light' ? 'dark' : 'light'
    if (typeof document === 'undefined') {
      set(next)
      return
    }
    // Skip the crossfade for reduce-motion users; CSS override on ::view-transition-* (above) is the defence-in-depth floor.
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      set(next)
      return
    }
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> }
    }
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        set(next)
      })
      return
    }
    set(next)
  }

  onMounted(() => {
    const stored = readStored()
    if (stored !== null) {
      set(stored)
      return
    }
    // First visit: follow device preference.
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    set(prefersDark ? 'dark' : 'light')
  })

  // `swap` is the user-initiated entry point; `set` is the underlying
  // primitive (mount, programmatic resets, tests). Older editions also
  // exposed a `resolved` computed, but once `ThemePref` collapsed to
  // `'light' | 'dark'` (System gone), `resolved` was byte-identical to
  // `pref` — dropped to keep the public API honest.
  return { pref, set, swap }
}
