/**
 * Theme composable — explicit 2-state preference (light / dark) with
 * localStorage persistence.
 *
 * DESIGN.md v3.0 "Organic Professional" is LIGHT-first per the YAML
 * palette (background `#f7faf4`, primary `#386948`). After user
 * feedback ("default colornya light saja"), this default is hard-
 * coded — there is no longer any OS-preference lookup anywhere in
 * the runtime theme path. Dark mode still works (token overrides in
 * `:root[data-theme="dark"]` in main.css) for users who opt in via
 * ThemeToggle, but the default visual story is the airy / fresh
 * cream palette.
 *
 * History: an earlier edition exposed a third "system" mode that
 * auto-tracked `prefers-color-scheme` while the page was open. That
 * was removed ("untuk system gak usah deh") in favour of a direct
 * 2-option toggle: every click is an explicit, persisted choice, and
 * there is no live OS-pref listener. A legacy `'system'` storage
 * value is migrated forward to `'light'` on the next read so old
 * visitors don't get silently re-classified with a phantom mode.
 *
 * SSR safety: window/localStorage access is guarded by a
 * `typeof window === 'undefined'` check in `readStored` and
 * `writeStored`, and a `typeof document === 'undefined'` check in
 * `applyToDocument` — both sentinels guard the same SSR case (no
 * DOM at render time), so the composable is safe to call during
 * server render. Note: the no-flash inline script in
 * `nuxt.config.ts` is what actually paints the pre-hydration
 * `data-theme`; `useTheme`'s SSR placeholder (the `light` ref
 * default) is incidental and is replaced on hydration when
 * `onMounted` runs.
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
  } catch {
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
      // Explicit pref already persisted — apply and stop.
      set(stored)
      return
    }
    // First visit OR legacy `'system'` storage: default to `'light'`.
    // The project is light-first per DESIGN.md and the user pinned
    // the default to light; OS preference is no longer consulted at
    // runtime. Persist the explicit value so future visits start with
    // a real `'light'` or `'dark'`, not null/system.
    set('light')
  })

  // `swap` is the user-initiated entry point; `set` is the underlying
  // primitive (mount, programmatic resets, tests). Older editions also
  // exposed a `resolved` computed, but once `ThemePref` collapsed to
  // `'light' | 'dark'` (System gone), `resolved` was byte-identical to
  // `pref` — dropped to keep the public API honest.
  return { pref, set, swap }
}
