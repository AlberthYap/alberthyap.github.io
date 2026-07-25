/**
 * Theme composable — three states (system / light / dark) with localStorage
 * persistence and live OS-preference detection.
 *
 * DESIGN.md v3.0 "Organic Professional" is LIGHT-first per the YAML
 * palette (background `#f7faf4`, primary `#386948`). Dark mode still
 * works (token overrides in `:root[data-theme="dark"]` in main.css)
 * for users who opt in via ThemeToggle, but the default visual story
 * is the airy / fresh cream palette.
 *
 * SSR safety: window/localStorage access is gated behind `import.meta.client`.
 * Server render uses `system` as the placeholder; the no-flash script in
 * `nuxt.config.ts` resolves the real theme before paint, so SSR placeholder
 * never appears to the user.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'

export type ThemePref = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme-pref'

/** Shared state across components (module-level singletons in Vue/Nuxt). */
const pref = ref<ThemePref>('system')
const resolved = ref<ResolvedTheme>('light')
const media = ref<MediaQueryList | null>(null)

function readStored(): ThemePref | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' || v === 'system' ? v : null
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

export function resolvePref(p: ThemePref): ResolvedTheme {
  if (p === 'light') return 'light'
  if (p === 'dark') return 'dark'
  // system — light is the default so OS-pref "no preference" reads as light.
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyToDocument(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

function onSystemChange(): void {
  if (pref.value !== 'system') return
  const next = resolvePref('system')
  resolved.value = next
  applyToDocument(next)
}

export function useTheme() {
  onMounted(() => {
    const stored = readStored()
    if (stored) pref.value = stored
    resolved.value = resolvePref(pref.value)
    applyToDocument(resolved.value)

    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      media.value = mq
      if (mq.addEventListener) {
        mq.addEventListener('change', onSystemChange)
      } else {
        mq.addListener(onSystemChange)
      }
    }
  })

  onUnmounted(() => {
    if (!media.value) return
    if (media.value.removeEventListener) {
      media.value.removeEventListener('change', onSystemChange)
    } else {
      media.value.removeListener(onSystemChange)
    }
  })

  function cycle(): void {
    // Three-state cycle: light → dark → system → light.
    // No no-op skip is applied — even when 'system' resolves to the
    // same theme as current explicit, the icon advances (moon→monitor)
    // giving the user visual feedback that mode changed to auto.
    const order: ThemePref[] = ['light', 'dark', 'system']
    const currentIdx = order.indexOf(pref.value)
    const next = order[(currentIdx + 1) % 3]
    set(next)
  }

  function set(next: ThemePref): void {
    pref.value = next
    resolved.value = resolvePref(next)
    applyToDocument(resolved.value)
    writeStored(next)
  }

  const label = computed<string>(() => {
    const order: ThemePref[] = ['light', 'dark', 'system']
    const currentIdx = order.indexOf(pref.value)
    const next = order[(currentIdx + 1) % 3]
    return `Theme: ${pref.value} (${resolved.value}). Click → ${next}.`
  })

  return { pref, resolved, cycle, set, label }
}
