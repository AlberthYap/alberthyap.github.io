<script setup lang="ts">
/**
 * Theme dropdown — select Light / Dark / System from a contextual menu.
 *
 * Replaces the old cycling button after user feedback: "yang dark mode itu,
 * jadi dropdown aja jadi pilihan saja biar lebih enak untuk user experiencenya."
 *
 * Glass-surface dropdown with explicit options and a visual separator between
 * the explicit modes (Light / Dark) and the meta mode (System / auto).
 * Uses pointerdown for faster visual response and full keyboard a11y
 * (arrow keys, Enter/Space, Escape, aria-activedescendant).
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTheme, resolvePref } from '~/composables/useTheme'

const { pref, resolved, set } = useTheme()

/** What theme `system` would resolve to based on OS preference — independent
 *  of the current explicit preference. Used for the System option label so
 *  it always shows an accurate prediction (e.g. "System (dark)" even when
 *  the user is on explicit Light mode but the OS is in dark mode). */
const systemResolved = computed(() => resolvePref('system'))
const isOpen = ref(false)
const activeIdx = ref(0)

interface Option {
  value: 'light' | 'dark' | 'system'
  label: string
  icon: 'sun' | 'moon' | 'monitor'
}

const allOptions = computed<Option[]>(() => [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: `System (${systemResolved.value})`, icon: 'monitor' },
])

function toggle() {
  if (isOpen.value) {
    isOpen.value = false
  } else {
    isOpen.value = true
    activeIdx.value = allOptions.value.findIndex(o => o.value === pref.value)
  }
}

function select(value: 'light' | 'dark' | 'system') {
  set(value)
  isOpen.value = false
}

/** Close dropdown on click/tap outside the picker area. */
function onDocumentPointerDown(e: PointerEvent) {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (!target.closest('[data-theme-picker]')) {
    isOpen.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  const opts = allOptions.value

  if (!isOpen.value) {
    // Closed: ArrowDown / Enter / Space opens the dropdown.
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      isOpen.value = true
      activeIdx.value = opts.findIndex(o => o.value === pref.value)
    }
    return
  }

  // Open: navigate, select, or close.
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIdx.value = (activeIdx.value + 1) % opts.length
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIdx.value = (activeIdx.value - 1 + opts.length) % opts.length
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      select(opts[activeIdx.value].value)
      break
    case 'Escape':
      isOpen.value = false
      break
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div
    data-theme-picker
    class="relative"
    @keydown="onKeydown"
  >
    <!-- Trigger button — shows sun/moon based on resolved theme -->
    <button
      type="button"
      :aria-label="`Theme: ${resolved}. ${isOpen ? 'Close' : 'Open'} theme selector.`"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-transparent text-muted transition-colors duration-[var(--motion-small)] ease-[var(--motion-easing)] hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-reduce:transition-none"
      @pointerdown="toggle"
    >
      <!-- Sun icon -->
      <svg
        v-if="resolved === 'light'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <!-- Moon icon -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition duration-[var(--motion-small)] ease-[var(--motion-easing)]"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-[var(--motion-micro)] ease-[var(--motion-easing)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        role="menu"
        :aria-activedescendant="`theme-opt-${allOptions[activeIdx].value}`"
        aria-label="Theme selector"
        class="absolute right-0 top-full mt-2 w-44 origin-top-right rounded-xl border border-outline-variant bg-surface-container shadow-lg backdrop-blur-md p-1.5 z-50"
      >
        <template v-for="(opt, idx) in allOptions" :key="opt.value">
          <!-- Visual separator before the System (meta) option -->
          <div
            v-if="idx === 2"
            class="my-1 mx-2 border-t border-outline-variant"
            role="separator"
          />

          <button
            :id="`theme-opt-${opt.value}`"
            type="button"
            role="menuitem"
            :aria-label="opt.value === 'system' ? `Set theme to system (${systemResolved})` : `Set theme to ${opt.value}`"
            :aria-current="pref === opt.value ? 'true' : undefined"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-label-md text-text transition-colors duration-[var(--motion-micro)] ease-[var(--motion-easing)] hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="{
              'bg-surface-container-high font-semibold': pref === opt.value,
              'bg-surface-container': allOptions[activeIdx].value === opt.value && pref !== opt.value,
            }"
            @pointerdown="select(opt.value)"
          >
            <!-- Sun icon -->
            <svg
              v-if="opt.icon === 'sun'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <!-- Monitor icon -->
            <svg
              v-else-if="opt.icon === 'monitor'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <!-- Moon icon -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>

            <span class="flex-1 text-left">{{ opt.label }}</span>

            <!-- Active indicator dot -->
            <span
              v-if="pref === opt.value"
              class="h-2 w-2 rounded-full bg-primary shrink-0"
              aria-hidden="true"
            />
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
