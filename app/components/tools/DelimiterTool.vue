<script setup lang="ts">
/**
 * DelimiterTool — Browser-based delimiter converter & data transformer.
 *
 * Paste delimited text (CSV, TSV, pipe, etc.), apply transforms,
 * and export in your chosen format. Auto-detects the input
 * delimiter after 800 ms of typing inactivity (toggleable).
 *
 * Layout (v5 — dense professional workspace):
 *   ┌ compact workspace header ... status + local-only note
 *   ├ toast row ................... auto-detect + dedupe feedback
 *   ├ quick start .................. sample chips
 *   ├ workspace grid (xl) ......... sidebar | input | output
 *   │   └ sidebar (accordion) ..... Conversion · Format · Delimiter open,
 *   │                            Quotes · Cleanup · Advanced · History
 *   │                            collapsed by default (▸/▾ headers)
 *   │   └ INPUT card .............. toolbar + textarea (compact, soft wrap)
 *   │   └ OUTPUT card ............. tabs [Table][JSON][Raw] + surface
 *   ├ action bar (below editor) ... ✨ Convert + Copy/Download/Unique/Clear
 *   ├ advanced utilities .......... collapsible text ops (Reverse…Count)
 *   └ footer hint (kbd shortcuts)
 *
 * State + behaviour lives in `app/composables/useDelimiterStore.ts`
 * (single source of truth). This file renders + binds DOM events.
 *
 * Selector contract (kept stable for unit + e2e suites):
 *   `.dtool`, `.dtool__title`, `.dtool__privacy-badge`, `.dtool__seg`,
 *   `.dtool__seg-btn`, `.dtool__check`, `.dtool__check--sub`,
 *   `.dtool__dedupe-group`, `#delimiter-source`, `#output-format`,
 *   `.output-surface`, `.output-empty`, `.output-stat-strip`,
 *   `.dtool__sidebar`, `#delimiter-transforms`, `.dtool__dedupe-notice`.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { useDelimiterStore } from '~~/app/composables/useDelimiterStore'

// ─── Store (single source of truth) ────────────────────────
const store = useDelimiterStore()
const {
  // State
  input, mode, inDelim, customInDelim, outDelim, customOutDelim, outFormat,
  copied, downloaded,
  trimOn, quoteOp, dedupeOn, dedupeInsensitive, sortOn, sortCol, sortDir,
  reverseOn, skipBlank, hasHeader, advancedOpen,
  history,
  outputFlash, dedupeNotice, autoDetectResult,
  autoDetectOnPaste, manualOverride,
  status, toast,

  // Computeds
  transformed, output, rowCount, colCount,
  inputLineCount, inputBytes, outputBytes, formatLabel,
  activeTransformCount,
  fromPreset, toPreset,

  // Constants
  DELIM_OPTIONS, QUICK_EXAMPLES,

  // Actions
  autoDetect, doCopy, doDownload, clearInput, resetTransforms,
  loadSample, cycleSortDir,
  loadExample, convert, applyUtility, setFromFormat, setToFormat,
  restoreEntry, clearHistory, formatTime, summary,
} = store

// ─── Local component state ────────────────────────────────
// Hydration marker — e2e suite waits for `.dtool[data-hydrated="true"]`
// before interacting.
const hydrated = ref(false)

// Header status readout — Ready → Detecting → Converted → Copied.
const statusLabel = computed(() => {
  if (status.value === 'processing') return 'Detecting'
  if (status.value === 'completed') return 'Converted'
  if (status.value === 'copied') return 'Copied'
  return 'Ready'
})

// Sidebar accordion — user brief: Conversion/Format/Delimiter open by
// default; Quotes/Cleanup/Advanced/History collapsed (▸/▾ headers).
const openSections = ref({
  conversion: true,
  format: true,
  delimiter: true,
  quotes: false,
  cleanup: false,
  advanced: false,
  history: false,
})
type SectionKey = keyof typeof openSections.value
function toggleSection(key: SectionKey) {
  openSections.value[key] = !openSections.value[key]
}

// Advanced utilities toolbar — collapsed behind a toggle per brief #7.
const utilitiesOpen = ref(false)

// Sidebar From → To pickers (brief §"Input / Output Format").
const FROM_FORMATS = [
  { key: 'csv', label: 'CSV' },
  { key: 'tsv', label: 'TSV' },
  { key: 'semicolon', label: 'Semi' },
  { key: 'pipe', label: 'Pipe' },
  { key: 'custom', label: 'Custom…' },
] as const

const TO_FORMATS = [
  { key: 'table', label: 'Table' },
  { key: 'json', label: 'JSON' },
  { key: 'csv', label: 'CSV' },
  { key: 'tsv', label: 'TSV' },
] as const

// Output tabs — [Table][JSON][Raw] (brief #5). Raw = delimited output.
// JSON covers both json-array and json-objects (both stay reachable via
// the hidden #output-format select that the e2e suite drives).
const OUTPUT_TABS = [
  { key: 'table', label: 'Table' },
  { key: 'json', label: 'JSON' },
  { key: 'raw', label: 'Raw' },
] as const

const activeOutputTab = computed<'table' | 'json' | 'raw'>(() => {
  if (outFormat.value === 'table') return 'table'
  if (outFormat.value === 'json-array' || outFormat.value === 'json-objects') return 'json'
  return 'raw'
})

function setOutputTab(tab: 'table' | 'json' | 'raw') {
  if (tab === 'table') outFormat.value = 'table'
  else if (tab === 'json') outFormat.value = 'json-objects'
  else outFormat.value = 'delimited'
}

// Table view header row — `transformed[0]` is `string[] | undefined`
// under noUncheckedIndexedAccess, so expose a typed computed for the
// <thead> v-for instead of indexing the array in the template. `slice(1)`
// on a length-1 array already yields `[]`, so no extra length guard is
// needed (it would wrongly duplicate the single header row into <tbody>).
const headerRow = computed(() => (transformed.value[0] ?? []))
const bodyRows = computed(() =>
  hasHeader.value ? transformed.value.slice(1) : transformed.value,
)

// Conversion summary readout (brief #7) — a premium "result receipt"
// shown after Convert/Copy: "✓ Converted · CSV → JSON · 33 rows ·
// 5 columns · 120 KB". Uses the From → To preset language so it reads
// as one coherent conversion statement.
const FROM_PRESET_LABELS: Record<typeof fromPreset.value, string> = {
  csv: 'CSV', tsv: 'TSV', semicolon: 'Semi', pipe: 'Pipe', custom: 'Custom',
}
const toPresetLabel = computed(() => {
  if (toPreset.value === 'json') return 'JSON'
  if (toPreset.value === 'table') return 'Table'
  if (toPreset.value === 'tsv') return 'TSV'
  return 'CSV'
})
const conversionSummary = computed(() => {
  if (!output.value) return ''
  return [
    `${FROM_PRESET_LABELS[fromPreset.value]} → ${toPresetLabel.value}`,
    `${rowCount.value} row${rowCount.value !== 1 ? 's' : ''}`,
    `${colCount.value} col${colCount.value !== 1 ? 's' : ''}`,
    `${outputBytes.value} B`,
  ].join(' · ')
})
// Surface the receipt only after an explicit Convert/Copy action, not on
// every keystroke (the live preview already covers real-time feedback).
const showSummary = computed(() =>
  output.value && (status.value === 'completed' || status.value === 'copied'),
)

// Compact text-utility toolbar (brief §"Utility Actions").
const UTILITIES = [
  { key: 'reverse', label: 'Reverse', icon: '⇅' },
  { key: 'shuffle', label: 'Shuffle', icon: '⤨' },
  { key: 'number', label: 'Number', icon: '№' },
  { key: 'upper', label: 'UPPER', icon: 'A' },
  { key: 'lower', label: 'lower', icon: 'a' },
  { key: 'count', label: 'Count', icon: '∑' },
] as const

// Document-level ⌘+Enter (convert) / ⌘+Shift+C (copy) shortcuts.
function onKey(e: KeyboardEvent) { store.onKeydown(e) }

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  await nextTick()
  hydrated.value = true
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
})

function copy() { return doCopy() }
</script>

<template>
  <div
    class="dtool flex flex-col gap-5"
    :data-hydrated="hydrated"
  >
    <!-- Compact workspace header — the page hero owns the tool title. -->
    <header class="dtool__workspace-header">
      <div class="dtool__workspace-kicker">
        <span class="dtool__workspace-kicker-mark" aria-hidden="true">↳</span>
        <span class="dtool__title font-mono text-label-sm uppercase tracking-widest text-muted">
          Workspace
        </span>
        <span class="dtool__workspace-note dtool__privacy-badge">Runs locally · no uploads</span>
      </div>

      <!-- Status indicator — Ready / Detecting / Converted / Copied -->
      <div class="dtool__status" role="status" aria-live="polite">
        <span
          class="dtool__status-dot"
          :class="`dtool__status-dot--${status}`"
          aria-hidden="true"
        />
        <span class="dtool__status-label">{{ statusLabel }}</span>
      </div>
    </header>

    <!-- Toast row — auto-detect + dedupe feedback ────────────────── -->
    <div v-if="autoDetectResult || dedupeNotice" class="flex items-center gap-3 flex-wrap">
      <span
        v-if="autoDetectResult"
        class="dtool__dedupe-notice dtool__autodetect-toast"
        role="status"
      >
        Detected delimiter: <strong>{{ autoDetectResult.label }}</strong>
        ({{ autoDetectResult.char }})
      </span>
      <span
        v-if="dedupeNotice"
        class="dtool__dedupe-notice"
        role="status"
      >
        Removed {{ dedupeNotice.removed }} duplicate{{ dedupeNotice.removed !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Quick start — sample data in one compact band ───────────── -->
    <div class="dtool__quickexamples" aria-label="Quick start">
      <span class="dtool__quickexamples-label font-mono text-label-sm uppercase tracking-widest text-muted">
        Quick start
      </span>
      <button
        v-for="(ex, key) in QUICK_EXAMPLES"
        :key="key"
        type="button"
        class="dtool__pill"
        :data-example="key"
        @click="loadExample(key as 'csv' | 'tsv' | 'json' | 'pipe')"
      >
        <span aria-hidden="true">⌗</span>
        {{ ex.label }}
      </button>
    </div>

    <!-- ── Workspace: sidebar | input | output (+bars) ───────────── -->
    <div class="dtool__workspace">
      <!-- Sidebar (accordion) — LEFT on xl, stacked last on mobile -->
      <aside class="dtool__sidebar flex flex-col gap-3 min-w-0" aria-label="Configuration">
        <div class="dtool__sidebar-header flex items-center justify-between gap-3 flex-wrap">
          <h3 class="dtool__sidebar-heading font-mono text-label-sm uppercase tracking-widest text-muted">
            <span aria-hidden="true">⚙</span>
            Configuration
          </h3>
          <label class="dtool__check">
            <input
              v-model="autoDetectOnPaste"
              type="checkbox"
              class="dtool__check-input"
            >
            <span class="dtool__check-label">Detect while typing</span>
          </label>
        </div>

        <div class="dtool__sidebar-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <!-- Card: Conversion Mode (open by default) ─────────── -->
          <div class="dtool__sidebar-card">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.conversion"
              @click="toggleSection('conversion')"
            >
              <span class="dtool__sidebar-card-title">Conversion Mode</span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.conversion && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.conversion" class="dtool__sidebar-card-body flex flex-col gap-3">
              <div class="dtool__seg">
                <button
                  type="button"
                  class="dtool__seg-btn"
                  :class="mode === 'split' && 'dtool__seg-btn--active'"
                  @click="mode = 'split'"
                >
                  Split
                </button>
                <button
                  type="button"
                  class="dtool__seg-btn"
                  :class="mode === 'join' && 'dtool__seg-btn--active'"
                  @click="mode = 'join'"
                >
                  Join
                </button>
              </div>
              <p class="text-xs text-muted leading-relaxed">
                {{ mode === 'split'
                  ? 'Split values into rows & columns'
                  : 'Combine lines into one row' }}
              </p>
            </div>
          </div>

          <!-- Card: From → To format (open by default) ─────────── -->
          <div class="dtool__sidebar-card">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.format"
              @click="toggleSection('format')"
            >
              <span class="dtool__sidebar-card-title">Format</span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.format && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.format" class="dtool__sidebar-card-body flex flex-col gap-3">
              <section class="dtool__sidebar-section">
                <div class="dtool__sidebar-label font-mono text-label-sm uppercase tracking-widest text-muted">
                  From
                </div>
                <div class="dtool__seg" role="radiogroup" aria-label="Input format">
                  <button
                    v-for="f in FROM_FORMATS"
                    :key="f.key"
                    type="button"
                    class="dtool__seg-btn"
                    :class="fromPreset === f.key && 'dtool__seg-btn--active'"
                    role="radio"
                    :aria-checked="fromPreset === f.key"
                    @click="setFromFormat(f.key)"
                  >
                    {{ f.label }}
                  </button>
                </div>
                <input
                  v-if="inDelim === 'custom'"
                  v-model="customInDelim"
                  placeholder="e.g. :"
                  maxlength="3"
                  class="mt-2 w-20 rounded border border-outline-variant bg-surface px-2 py-1 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
              </section>

              <section class="dtool__sidebar-section">
                <div class="dtool__sidebar-label font-mono text-label-sm uppercase tracking-widest text-muted">
                  To
                </div>
                <div class="dtool__seg" role="radiogroup" aria-label="Output format preset">
                  <button
                    v-for="t in TO_FORMATS"
                    :key="t.key"
                    type="button"
                    class="dtool__seg-btn"
                    :class="toPreset === t.key && 'dtool__seg-btn--active'"
                    role="radio"
                    :aria-checked="toPreset === t.key"
                    @click="setToFormat(t.key)"
                  >
                    {{ t.label }}
                  </button>
                </div>
              </section>
            </div>
          </div>

          <!-- Card: Delimiter (open by default) ───────────────── -->
          <div class="dtool__sidebar-card">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.delimiter"
              @click="toggleSection('delimiter')"
            >
              <span class="dtool__sidebar-card-title">Delimiter</span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.delimiter && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.delimiter" class="dtool__sidebar-card-body flex flex-col gap-3">
              <section v-if="mode === 'split'" class="dtool__sidebar-section">
                <div class="dtool__sidebar-label font-mono text-label-sm uppercase tracking-widest text-muted">
                  Separator
                </div>
                <div class="dtool__seg" role="radiogroup" aria-label="Output delimiter">
                  <button
                    v-for="opt in DELIM_OPTIONS"
                    :key="`jd-${opt.key}`"
                    type="button"
                    class="dtool__seg-btn"
                    :class="outDelim === opt.key && 'dtool__seg-btn--active'"
                    role="radio"
                    :aria-checked="outDelim === opt.key"
                    @click="outDelim = opt.key"
                  >
                    <span aria-hidden="true">{{ opt.char }}</span>
                    {{ opt.label }}
                  </button>
                </div>
                <input
                  v-if="outDelim === 'custom'"
                  v-model="customOutDelim"
                  placeholder="e.g. :"
                  maxlength="3"
                  class="mt-2 w-20 rounded border border-outline-variant bg-surface px-2 py-1 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
              </section>

              <section v-else class="dtool__sidebar-section">
                <div class="dtool__sidebar-label font-mono text-label-sm uppercase tracking-widest text-muted">
                  Separator
                </div>
                <p class="text-xs text-muted">
                  Choose how combined lines are joined.
                </p>
              </section>

              <button
                type="button"
                class="dtool__sidebar-link text-xs"
                :title="manualOverride ? 'Detect the delimiter again' : 'Detect the delimiter from the current input'"
                @click="(manualOverride = false, autoDetect())"
              >
                Detect now
              </button>
            </div>
          </div>

          <!-- Card: Quotes (collapsed) ─────────────────────────── -->
          <div class="dtool__sidebar-card">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.quotes"
              @click="toggleSection('quotes')"
            >
              <span class="dtool__sidebar-card-title">Quotes</span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.quotes && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.quotes" class="dtool__sidebar-card-body flex flex-col gap-3">
              <div class="dtool__seg" aria-label="Quote handling">
                <button
                  type="button"
                  class="dtool__seg-btn"
                  :class="quoteOp === 'none' && 'dtool__seg-btn--active'"
                  :aria-pressed="quoteOp === 'none'"
                  @click="quoteOp = 'none'"
                >
                  None
                </button>
                <button
                  type="button"
                  class="dtool__seg-btn"
                  :class="quoteOp === 'add' && 'dtool__seg-btn--active'"
                  :aria-pressed="quoteOp === 'add'"
                  @click="quoteOp = 'add'"
                >
                  Add
                </button>
                <button
                  type="button"
                  class="dtool__seg-btn"
                  :class="quoteOp === 'remove' && 'dtool__seg-btn--active'"
                  :aria-pressed="quoteOp === 'remove'"
                  @click="quoteOp = 'remove'"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <!-- Card: Cleanup (collapsed) ────────────────────────── -->
          <div class="dtool__sidebar-card">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.cleanup"
              @click="toggleSection('cleanup')"
            >
              <span class="dtool__sidebar-card-title">Cleanup</span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.cleanup && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.cleanup" class="dtool__sidebar-card-body flex flex-col gap-3">
              <label class="dtool__check">
                <input v-model="trimOn" type="checkbox" class="dtool__check-input">
                <span class="dtool__check-label">Trim spaces</span>
              </label>

              <label class="dtool__check">
                <input v-model="sortOn" type="checkbox" class="dtool__check-input">
                <span class="dtool__check-label">Sort A-Z</span>
              </label>

              <label class="dtool__check">
                <input v-model="skipBlank" type="checkbox" class="dtool__check-input">
                <span class="dtool__check-label">Remove empty rows</span>
              </label>

              <fieldset class="dtool__dedupe-group">
                <legend class="dtool__dedupe-legend">Dedupe</legend>
                <label class="dtool__check">
                  <input
                    v-model="dedupeOn"
                    type="checkbox"
                    class="dtool__check-input"
                    aria-label="Remove duplicates"
                  >
                  <span class="dtool__check-label">Remove duplicates</span>
                </label>
                <label v-if="dedupeOn" class="dtool__check dtool__check--sub">
                  <input
                    v-model="dedupeInsensitive"
                    type="checkbox"
                    class="dtool__check-input"
                  >
                  <span class="dtool__check-label">Case-insensitive</span>
                </label>
              </fieldset>

              <label class="dtool__check">
                <input
                  v-model="hasHeader"
                  type="checkbox"
                  class="dtool__check-input"
                  aria-label="Header row"
                >
                <span class="dtool__check-label">Header row</span>
              </label>
            </div>
          </div>

          <!-- Card: Advanced transforms (collapsed) ─────────────── -->
          <div class="dtool__sidebar-card">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.advanced"
              @click="toggleSection('advanced')"
            >
              <span class="dtool__sidebar-card-title">Advanced</span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.advanced && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.advanced" class="dtool__sidebar-card-body flex flex-col gap-3">
              <button
                type="button"
                class="dtool__advanced-toggle"
                aria-controls="delimiter-transforms"
                :aria-expanded="advancedOpen"
                @click="advancedOpen = !advancedOpen"
              >
                <span class="dtool__sidebar-label font-mono text-label-sm uppercase tracking-widest text-muted">
                  Advanced transforms
                </span>
                <span
                  aria-hidden="true"
                  class="dtool__advanced-caret"
                  :class="advancedOpen && 'dtool__advanced-caret--open'"
                >
                  ▾
                </span>
                <span
                  v-if="activeTransformCount > 0"
                  class="dtool__advanced-count"
                >
                  {{ activeTransformCount }}
                </span>
              </button>

              <div
                v-show="advancedOpen"
                id="delimiter-transforms"
                class="dtool__advanced-panel"
              >
                <p class="dtool__advanced-help text-xs text-muted">
                  These options change the result before you copy it.
                </p>

                <div v-if="sortOn" class="dtool__sort-control">
                  <select
                    v-model.number="sortCol"
                    class="dtool__sort-select rounded border border-outline-variant bg-surface px-2 py-1 text-sm"
                  >
                    <option
                      v-for="i in colCount || 1"
                      :key="i"
                      :value="i - 1"
                    >
                      Col {{ i }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="dtool__pill"
                    @click="cycleSortDir"
                  >
                    {{ sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}
                  </button>
                </div>

                <label class="dtool__check">
                  <input v-model="reverseOn" type="checkbox" class="dtool__check-input">
                  <span class="dtool__check-label">Reverse rows</span>
                </label>

                <button
                  type="button"
                  class="dtool__pill dtool__reset-btn mt-2"
                  @click="resetTransforms"
                >
                  <span aria-hidden="true">↺</span>
                  Reset all
                </button>
              </div>
            </div>
          </div>

          <!-- Card: History (collapsed) ────────────────────────── -->
          <div class="dtool__sidebar-card dtool__sidebar-card--subtle">
            <button
              type="button"
              class="dtool__accordion-toggle"
              :aria-expanded="openSections.history"
              @click="toggleSection('history')"
            >
              <span class="dtool__sidebar-card-title">
                <span>History</span>
                <span
                  v-if="history.length > 0"
                  class="dtool__sidebar-card-count"
                >{{ history.length }}</span>
              </span>
              <span
                class="dtool__accordion-caret"
                :class="openSections.history && 'dtool__accordion-caret--open'"
                aria-hidden="true"
              >▾</span>
            </button>
            <div v-show="openSections.history" class="dtool__sidebar-card-body flex flex-col gap-3">
              <ul v-if="history.length > 0" class="dtool__history-list">
                <li
                  v-for="entry in history.slice(0, 4)"
                  :key="entry.ts"
                  class="dtool__history-item"
                >
                  <button
                    type="button"
                    class="dtool__history-btn"
                    @click="restoreEntry(entry)"
                  >
                    <span class="dtool__history-meta">{{ summary(entry) }}</span>
                    <span class="dtool__history-time">{{ formatTime(entry.ts) }}</span>
                  </button>
                </li>
              </ul>
              <p v-else class="dtool__history-empty">
                No recent conversions yet. Type something to start.
              </p>
              <button
                v-if="history.length > 0"
                type="button"
                class="dtool__history-clear"
                @click="clearHistory"
              >
                <span aria-hidden="true">⌫</span>
                Clear history
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Editor card: input (CENTER) ────────────────────────────── -->
      <section class="editor-card editor-card--input flex flex-col gap-3 min-w-0">
        <header class="dtool__editor-toolbar flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="font-mono text-label-sm uppercase tracking-widest text-muted">
              Input
            </span>
            <span
              v-if="autoDetectResult"
              class="dtool__autodetect-chip"
              aria-hidden="true"
            >
              ✓ {{ autoDetectResult.label }}
            </span>
          </div>
          <span
            class="input-stat-strip text-sm text-muted font-mono"
            style="min-width: 0;"
          >
            {{ inputLineCount }} line{{ inputLineCount !== 1 ? 's' : '' }} ·
            {{ inputBytes }} B
          </span>
        </header>
        <p id="delimiter-source-hint" class="dtool__editor-hint text-xs text-muted">
          Paste CSV, TSV, JSON, or pipe-delimited text. Choose a sample above if you want to see how it works.
        </p>

        <textarea
          id="delimiter-source"
          v-model="input"
          aria-describedby="delimiter-source-hint"
          wrap="soft"
          placeholder="Paste your data here…"
          spellcheck="false"
          class="dtool__editor-textarea w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>

      <!-- Editor card: output (RIGHT) ────────────────────────────── -->
      <section class="editor-card editor-card--output flex flex-col gap-3 min-w-0">
        <header class="dtool__editor-toolbar flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="font-mono text-label-sm uppercase tracking-widest text-muted">
              Output
            </span>
            <!-- Tabs: Table / JSON / Raw (brief #5) -->
            <div class="dtool__seg" role="radiogroup" aria-label="Output view">
              <button
                v-for="tab in OUTPUT_TABS"
                :key="tab.key"
                type="button"
                class="dtool__seg-btn"
                :class="activeOutputTab === tab.key && 'dtool__seg-btn--active'"
                role="radio"
                :aria-checked="activeOutputTab === tab.key"
                @click="setOutputTab(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>
            <!-- Hidden native select retains the e2e contract
                 (`#output-format selectOption('json-array')`). -->
            <select
              id="output-format"
              v-model="outFormat"
              aria-label="Output format"
              class="sr-only"
            >
              <option value="table">Table</option>
              <option value="json-array">JSON · Array</option>
              <option value="json-objects">JSON · Objects</option>
              <option value="delimited">Delimited</option>
            </select>
          </div>
          <span
            v-if="output"
            class="output-stat-strip text-sm text-muted font-mono"
            style="min-width: 0;"
          >
            {{ rowCount }} row{{ rowCount !== 1 ? 's' : '' }}
            ·
            {{ colCount }} col{{ colCount !== 1 ? 's' : '' }}
            ·
            {{ formatLabel }}
            ·
            {{ outputBytes }} B
          </span>
        </header>

        <div
          v-if="output"
          class="output-surface relative rounded-xl bg-surface overflow-x-hidden overflow-y-auto"
          :class="outputFlash && 'output-surface--flash'"
        >
          <!-- Table view — real <table> when Table tab is active -->
          <table
            v-if="activeOutputTab === 'table' && transformed.length"
            class="output-table"
          >
            <thead v-if="hasHeader">
              <tr>
                <th
                  v-for="(cell, ci) in headerRow"
                  :key="`h-${ci}`"
                  scope="col"
                >{{ cell }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in bodyRows"
                :key="ri"
              >
                <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
          <!-- JSON / Raw views — plain text output -->
          <pre
            v-else
            class="output-raw font-mono text-sm text-text leading-relaxed whitespace-pre-wrap"
          ><code>{{ output }}</code></pre>
        </div>

        <div
          v-else
          class="output-empty flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center"
        >
          <div class="output-empty__icon" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-base font-semibold text-text">Your result will appear here</p>
            <p class="text-sm text-muted">
              Paste data on the left, or start with one of the samples above.
            </p>
          </div>
          <button
            type="button"
            class="dtool__pill dtool__pill--primary"
            @click="loadSample"
          >
            <span aria-hidden="true">⌗</span>
            Try sample
          </button>
        </div>
      </section>

      <!-- Action bar — Convert dominates, utilities below (brief #6) ─ -->
      <div class="dtool__actionbar flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6" role="toolbar" aria-label="Conversion actions">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <button
            type="button"
            class="dtool__convert-btn"
            :disabled="!input.trim()"
            title="Add data first, then convert"
            @click="convert"
          >
            <span aria-hidden="true">✨</span>
            Convert
          </button>

          <!-- Conversion summary receipt (brief #7) -->
          <Transition name="dtool-summary">
            <span
              v-if="showSummary"
              class="dtool__summary"
              role="status"
              aria-live="polite"
            >
              <span class="dtool__summary-check" aria-hidden="true">✓</span>
              <span class="dtool__summary-label">Converted successfully</span>
              <span class="dtool__summary-route">{{ conversionSummary }}</span>
            </span>
          </Transition>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="dtool__pill"
            :aria-pressed="copied"
            :disabled="!output"
            title="Copy the converted result"
            @click="copy"
          >
            <span aria-hidden="true">{{ copied ? '✓' : '⎘' }}</span>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>

          <button
            type="button"
            class="dtool__pill"
            :disabled="!output"
            title="Download the converted result"
            @click="doDownload"
          >
            <span aria-hidden="true">{{ downloaded ? '✓' : '⤓' }}</span>
            {{ downloaded ? 'Downloaded' : 'Download' }}
          </button>

          <span class="dtool__actionbar-sep" aria-hidden="true" />

          <button
            type="button"
            class="dtool__pill"
            :class="dedupeOn && 'dtool__pill--active'"
            :aria-pressed="dedupeOn"
            @click="dedupeOn = !dedupeOn"
          >
            <span aria-hidden="true">⊟</span>
            Unique
          </button>

          <button
            type="button"
            class="dtool__pill"
            :disabled="!input"
            title="Clear the input and result"
            @click="clearInput"
          >
            <span aria-hidden="true">⌫</span>
            Clear
          </button>
        </div>
      </div>

      <!-- Advanced utilities — collapsible text ops (brief #7) ───── -->
      <div class="dtool__utilitybar">
        <button
          type="button"
          class="dtool__utility-toggle"
          :aria-expanded="utilitiesOpen"
          @click="utilitiesOpen = !utilitiesOpen"
        >
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">
            Advanced utilities
          </span>
          <span
            class="dtool__accordion-caret"
            :class="utilitiesOpen && 'dtool__accordion-caret--open'"
            aria-hidden="true"
          >▾</span>
        </button>
        <div v-show="utilitiesOpen" class="dtool__utility-pills flex flex-wrap items-center gap-2">
          <button
            v-for="u in UTILITIES"
            :key="u.key"
            type="button"
            class="dtool__pill"
            @click="applyUtility(u.key)"
          >
            <span aria-hidden="true">{{ u.icon }}</span>
            {{ u.label }}
          </button>
        </div>
      </div>

    </div>

    <!-- Footer hint (subtle keyboard surface) ─────────────────────── -->
    <footer class="dtool__footer text-xs text-muted font-mono">
      <span aria-hidden="true">⌘</span>
      Tip: <kbd>⌘/Ctrl + Enter</kbd> to convert · <kbd>⌘/Ctrl + Shift + C</kbd> to copy
    </footer>

    <!-- Global toast (bottom-center) ─────────────────────────────── -->
    <Transition name="dtool-toast">
      <div v-if="toast" class="dtool__toast" role="status" aria-live="polite">
        <span aria-hidden="true">✓</span>
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ──────────────────────────────────────────────────────────
 * Scoped CSS landmarks referenced by unit + e2e tests.
 * Visual styling uses design tokens (radius-lg, surface-*,
 * outline-variant) so the page reads as a premium developer
 * tool — Linear/Vercel/Raycast tier.
 * ────────────────────────────────────────────────────────── */

.dtool {
  --dtool_radius: var(--radius-lg, 16px);
}

.dtool__title {
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.dtool__workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 32px;
  padding: 0 2px 0.65rem;
  border-bottom: 1px solid var(--color-outline-variant, #e5e7e2);
}

.dtool__workspace-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.dtool__workspace-kicker-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--color-primary-soft, #deebe3);
  color: var(--color-primary-deep, #176b45);
  font-family: var(--font-mono);
  font-size: 13px;
}

.dtool__workspace-note {
  padding-left: 0.6rem;
  border-left: 1px solid var(--color-outline-variant, #e5e7e2);
  color: var(--color-muted, #5f665f);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.dtool__privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.dtool__editor-hint {
  margin: -0.25rem 0 0;
  line-height: 1.5;
}

/* Status indicator — Ready (muted), Detecting (amber pulse),
 * Converted (green), Copied (green glow). */
.dtool__status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  background: var(--color-surface-container-low, #f6f7f5);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted, #5f665f);
  white-space: nowrap;
}

.dtool__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-muted, #5f665f);
}

.dtool__status-dot--processing {
  background: var(--color-warning, #fad998);
  animation: dtool-status-pulse 1s ease-in-out infinite;
}

.dtool__status-dot--completed {
  background: var(--color-primary, #207a4a);
  box-shadow: 0 0 0 3px var(--color-primary-soft, #deebe3);
}

.dtool__status-dot--copied {
  background: var(--color-primary, #207a4a);
  box-shadow: 0 0 0 3px var(--color-primary-soft, #deebe3);
}

@keyframes dtool-status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* Workspace — sidebar | input | output on xl; stacked on mobile in the
 * order Input → Output → Actions → Utilities → Settings. The action +
 * utility bars sit directly beneath the editor columns (brief #6). */
.dtool__workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dtool__sidebar-header {
  padding: 0.7rem 0.75rem;
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  border-radius: var(--radius-md, 12px);
  background: var(--color-surface-container-low, #f6f7f5);
}

.dtool__sidebar-grid {
  padding: 0.75rem;
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  border-radius: var(--radius-md, 12px);
  background: color-mix(in oklab, var(--color-surface-container-low, #f6f7f5) 70%, transparent);
}

.dtool__sidebar-card + .dtool__sidebar-card {
  padding-top: 0.25rem;
}

.dtool__sidebar-card-body {
  padding-top: 10px;
}

.dtool__sidebar .dtool__seg-btn {
  padding-inline: 0.55rem;
}

.dtool__workspace .editor-card--input { order: 1; }
.dtool__workspace .editor-card--output { order: 2; }
.dtool__workspace .dtool__actionbar { order: 3; }
.dtool__workspace .dtool__sidebar { order: 4; }
.dtool__workspace .dtool__utilitybar { order: 5; }

@media (min-width: 1280px) {
  .dtool__workspace {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "side input output"
      "side actions actions"
      "side utils utils";
    align-items: stretch;
    gap: 1rem;
  }
  .dtool__workspace .dtool__sidebar { grid-area: side; order: 0; }
  .dtool__workspace .editor-card--input { grid-area: input; order: 0; }
  .dtool__workspace .editor-card--output { grid-area: output; order: 0; }
  .dtool__workspace .dtool__actionbar { grid-area: actions; order: 0; }
  .dtool__workspace .dtool__utilitybar { grid-area: utils; order: 0; }
  /* Keep the rail aligned with the editor without creating a second
   * scroll container inside the page. */
  .dtool__sidebar {
    align-self: start;
  }
}

/* Quick examples row. */
.dtool__quickexamples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.dtool__quickexamples-label {
  margin-right: 0.25rem;
}

/* Sidebar segmented groups — fill the compact rail evenly so options
 * never wrap into ragged rows (Mode/Format/Delimiter/Quotes).
 * `flex: 1 0 auto` = grow to fill each row but NEVER shrink below
 * content width (so "Custom…" or "Comma" never get crushed); rows
 * wrap naturally and each row stretches evenly. */
.dtool__sidebar .dtool__seg {
  display: flex !important;
  width: 100%;
}

.dtool__sidebar .dtool__seg-btn {
  flex: 1 0 auto;
  justify-content: center;
  min-width: 0;
  white-space: nowrap;
}

/* Sidebar accordion headers. */
.dtool__accordion-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.dtool__accordion-toggle:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
  border-radius: 6px;
}

.dtool__accordion-caret {
  display: inline-block;
  transition: transform var(--motion-micro, 150ms);
  color: var(--color-muted, #5f665f);
  font-size: 10px;
  margin-left: 0.5rem;
}

.dtool__accordion-caret--open {
  transform: rotate(180deg);
}

/* Segmented button group. */
.dtool__seg {
  display: inline-flex !important;
  flex-wrap: wrap !important;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: calc(var(--dtool_radius) - 4px);
  background: var(--color-surface-container-low, #f6f7f5);
  border: 1px solid var(--color-outline-variant, #e5e7e2);
}

.dtool__seg-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 0.45rem 0.8rem;
  border-radius: calc(var(--dtool_radius) - 6px);
  background: transparent;
  color: var(--color-muted, #5f665f);
  border: 0;
  cursor: pointer;
  transition:
    background-color var(--motion-micro, 150ms) var(--motion-easing, ease-out),
    color var(--motion-micro, 150ms) var(--motion-easing, ease-out);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.dtool__seg-btn:hover {
  color: var(--color-text, #151815);
}

.dtool__seg-btn:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
}

.dtool__seg-btn--active {
  background: var(--color-surface, #ffffff);
  color: var(--color-primary-deep, #176b45);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255, 255, 255, 0.4) inset;
}

/* Sidebar checkbox rows. */
.dtool__sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dtool__sidebar-label {
  display: block;
}

.dtool__check {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 14px;
  color: var(--color-text, #151815);
  cursor: pointer;
  user-select: none;
}

.dtool__check--sub {
  margin-left: 1.5rem;
  font-size: 13px;
  color: var(--color-muted, #5f665f);
}

/* Sidebar heading — IDE-style config rail header. */
.dtool__sidebar-heading {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.dtool__check-input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary, #207a4a);
}

.dtool__check-label {
  line-height: 1.2;
}

/* Fieldset + legend wrapper for the Dedupe group. */
.dtool__dedupe-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 0;
  margin: 0;
  padding: 0;
}

.dtool__dedupe-legend {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted, #5f665f);
  padding: 0;
  margin-bottom: 0.15rem;
}

/* Advanced transforms push-toggle and panel. */
.dtool__advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: inherit;
}

.dtool__advanced-toggle:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
  border-radius: 4px;
}

.dtool__advanced-caret {
  display: inline-block;
  transition: transform var(--motion-micro, 150ms);
  color: var(--color-muted, #5f665f);
  font-size: 11px;
}

.dtool__advanced-caret--open {
  transform: rotate(180deg);
}

.dtool__advanced-count {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  background: var(--color-primary-soft, #deebe3);
  color: var(--color-primary-deep, #176b45);
  padding: 2px 6px;
  border-radius: 999px;
}

.dtool__advanced-panel {
  margin-top: 0.6rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: var(--color-surface-container-low, #f6f7f5);
  border: 1px dashed var(--color-outline-variant, #e5e7e2);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dtool__advanced-help {
  margin: 0 0 0.25rem 0;
}

.dtool__sort-control {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1.5rem;
}

/* Action-bar pills. */
.dtool__pill {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #151815);
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition:
    background var(--motion-micro, 150ms),
    border-color var(--motion-micro, 150ms),
    color var(--motion-micro, 150ms);
}

.dtool__pill:hover {
  border-color: var(--color-primary, #207a4a);
  color: var(--color-primary-deep, #176b45);
}

.dtool__pill:disabled,
.dtool__convert-btn:disabled {
  cursor: not-allowed;
  opacity: 1;
  background: var(--color-surface-container-low, #f0f5ee);
  border-color: var(--color-outline-variant, #abb4ac);
  color: var(--color-muted, #59615a);
  box-shadow: none;
}

.dtool__pill:disabled:hover,
.dtool__convert-btn:disabled:hover {
  border-color: var(--color-outline-variant, #e5e7e2);
  background: var(--color-surface, #ffffff);
  color: var(--color-muted, #5f665f);
  transform: none;
}

.dtool__pill:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
}

.dtool__pill--active {
  background: var(--color-primary-soft, #deebe3);
  border-color: var(--color-primary, #207a4a);
  color: var(--color-primary-deep, #176b45);
}

.dtool__pill--primary {
  background: var(--color-primary, #207a4a);
  color: #ffffff;
  border-color: var(--color-primary, #207a4a);
}

.dtool__pill--primary:hover {
  background: var(--color-primary-deep, #176b45);
  border-color: var(--color-primary-deep, #176b45);
  color: #ffffff;
}

.dtool__reset-btn {
  align-self: flex-start;
}

/* Subtle link inside sidebar (Auto-detect trigger). */
.dtool__sidebar-link {
  color: var(--color-primary-deep, #176b45);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
  font-family: var(--font-mono);
  transition: color var(--motion-micro, 150ms);
}

.dtool__sidebar-link:hover {
  color: var(--color-primary, #207a4a);
  text-decoration: underline;
}

/* Dedupe-aware UX notices + auto-detect toast. */
.dtool__dedupe-notice {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  background: var(--color-primary-soft, #deebe3);
  color: var(--color-primary-deep, #176b45);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-primary, #207a4a);
}

/* Auto-detect chip in the INPUT toolbar. */
.dtool__autodetect-chip {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  background: var(--color-primary-soft, #deebe3);
  color: var(--color-primary-deep, #176b45);
  padding: 2px 8px;
  border-radius: 999px;
}

/* Output surface — premium tier. */
.output-surface {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  border-radius: var(--radius-lg, 16px);
  box-shadow:
    0 1px 0 color-mix(in oklab, rgb(255 255 255) 60%, transparent) inset,
    0 4px 14px -8px color-mix(in oklab, var(--color-text, #151815) 10%, transparent);
  transition: box-shadow var(--motion-medium, 200ms) ease-out,
              border-color var(--motion-micro, 150ms);
}

.output-surface:hover {
  border-color: color-mix(in oklab, var(--color-primary, #207a4a) 30%, var(--color-outline-variant, #e5e7e2));
}

.output-surface--flash {
  box-shadow:
    0 1px 0 color-mix(in oklab, rgb(255 255 255) 60%, transparent) inset,
    0 4px 14px -8px color-mix(in oklab, var(--color-text, #151815) 10%, transparent),
    0 0 0 3px var(--color-primary-soft, #deebe3);
}

/* Real table render for Table tab. */
.output-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
}

.output-table th,
.output-table td {
  width: auto;
  padding: 8px 12px;
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  vertical-align: top;
}

.output-table th {
  background: var(--color-surface-container-low, #f6f7f5);
  color: var(--color-primary-deep, #176b45);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.output-table tbody tr:nth-child(even) {
  background: var(--color-surface-container-lowest, #ffffff);
}

.output-table tbody tr:hover {
  background: var(--color-primary-soft, #deebe3);
}

/* Output surfaces keep both empty and populated states aligned with input. */
.output-surface,
.output-empty {
  min-height: clamp(300px, 38vh, 440px);
}

.output-raw {
  max-width: 100%;
  margin: 0;
  padding: 16px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Output empty state. */
.output-empty {
  background: var(--color-surface-container-low, #f6f7f5);
  border: 1px dashed var(--color-outline-variant, #e5e7e2);
  border-radius: var(--radius-lg, 16px);
}


.output-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg, 16px);
  background: var(--color-primary-soft, #deebe3);
  color: var(--color-primary-deep, #176b45);
}

/* Sidebar card — IDE-style: no boxes, just a rail. The workspace
 * (editor columns + action bar) carries the primary border; sidebar
 * sections get a quiet divider under each header instead of a full
 * card frame (brief §10 hierarchy). */
.dtool__sidebar-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0 2px 6px;
}

.dtool__sidebar-card--subtle {
  background: transparent;
  border: 0;
}

.dtool__sidebar-card-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-outline-variant, #e5e7e2);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--color-primary-deep, #176b45);
  text-align: left;
}


.dtool__sidebar-card-count {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  background: var(--color-primary-soft, #deebe3);
  color: var(--color-primary-deep, #176b45);
  border-radius: 999px;
  padding: 2px 7px;
  letter-spacing: 0;
}

/* History list inside the History card. */
.dtool__history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dtool__history-item {
  border-radius: 8px;
  overflow: hidden;
}

.dtool__history-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  transition: background var(--motion-micro, 150ms);
}

.dtool__history-btn:hover {
  background: var(--color-primary-soft, #deebe3);
}

.dtool__history-btn:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
}

.dtool__history-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text, #151815);
  font-weight: 500;
}

.dtool__history-time {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-muted, #5f665f);
}

.dtool__history-empty {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-muted, #5f665f);
  margin: 0;
  line-height: 1.5;
}

.dtool__history-clear {
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  background: transparent;
  border: 0;
  padding: 6px 0 0 0;
  color: var(--color-muted, #5f665f);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color var(--motion-micro, 150ms);
}

.dtool__history-clear:hover {
  color: var(--color-error, #c34747);
}

/* Editor card — premium tier. */
.editor-card {
  display: flex;
  flex-direction: column;
  min-height: clamp(350px, 42vh, 480px);
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-outline-variant, #e5e7e2);
  border-radius: var(--radius-lg, 16px);
  padding: 16px 16px 18px;

  box-shadow:
    0 1px 0 color-mix(in oklab, rgb(255 255 255) 60%, transparent) inset,
    0 4px 12px -8px color-mix(in oklab, var(--color-text, #151815) 8%, transparent);
}

.dtool__editor-textarea {
  flex: 1 1 auto;
  min-height: clamp(300px, 38vh, 440px);
  height: 100%;
}

@media (min-width: 1280px) {
  .dtool__editor-textarea {
    resize: none;
  }
}

.editor-card--output .output-surface,
.editor-card--output .output-empty {
  flex: 1 1 auto;
}

/* Primary Convert button — visually dominant (brief #6). */
.dtool__convert-btn {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  padding: 12px 28px;
  border-radius: var(--radius-md, 12px);
  background: var(--color-button-primary, #386948);
  color: #ffffff;
  border: 1px solid var(--color-button-primary, #386948);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  min-width: 160px;
  box-shadow: 0 6px 18px -6px color-mix(in oklab, var(--color-primary, #207a4a) 55%, transparent);
  transition:
    background var(--motion-micro, 150ms),
    transform var(--motion-micro, 150ms),
    box-shadow var(--motion-micro, 150ms);
}

.dtool__convert-btn:hover {
  background: var(--color-primary-deep, #176b45);
  border-color: var(--color-primary-deep, #176b45);
  transform: translateY(-1px);
}

.dtool__convert-btn:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
}

/* Conversion summary receipt (brief #7). */
.dtool__summary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-muted, #5f665f);
  background: var(--color-primary-soft, #deebe3);
  border: 1px solid var(--color-primary, #207a4a);
  border-radius: 999px;
  padding: 6px 14px;
}

.dtool__summary-check {
  color: var(--color-primary-deep, #176b45);
  font-weight: 700;
}

.dtool__summary-label {
  color: var(--color-text, #151815);
  font-weight: 600;
}

.dtool__summary-route {
  color: var(--color-primary-deep, #176b45);
  font-weight: 600;
}

.dtool-summary-enter-active,
.dtool-summary-leave-active {
  transition: opacity var(--motion-small, 180ms) var(--motion-easing, ease-out),
              transform var(--motion-small, 180ms) var(--motion-easing, ease-out);
}

.dtool-summary-enter-from,
.dtool-summary-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.dtool__actionbar-sep {
  width: 1px;
  align-self: stretch;
  background: var(--color-outline-variant, #e5e7e2);
}

/* Action bar — subtle elevated strip below the editor. */
.dtool__actionbar {
  padding: 10px 14px;
  border-radius: var(--radius-lg, 16px);
  background: var(--color-surface-container-low, #f6f7f5);
  border: 1px solid var(--color-outline-variant, #e5e7e2);
}

/* Advanced utilities toggle. */
.dtool__utility-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: inherit;
}

.dtool__utility-toggle:focus-visible {
  outline: 2px solid var(--color-primary, #207a4a);
  outline-offset: 2px;
  border-radius: 4px;
}

.dtool__utility-pills {
  margin-top: 0.6rem;
}

/* Global toast — fixed bottom-center, dark inverse surface. */
.dtool__toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 60;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 16px;
  border-radius: var(--radius-md, 12px);
  background: var(--color-inverse-surface, #0b0f0c);
  color: var(--color-inverse-on-surface, #9a9e99);
  border: 1px solid var(--color-outline, #747d75);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 12px 32px -12px color-mix(in oklab, var(--color-text, #151815) 35%, transparent);
}

.dtool-toast-enter-active,
.dtool-toast-leave-active {
  transition: opacity var(--motion-small, 180ms) var(--motion-easing, ease-out),
              transform var(--motion-small, 180ms) var(--motion-easing, ease-out);
}

.dtool-toast-enter-from,
.dtool-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* Mount hydration pulse — used in e2e waitFor. */
.dtool[data-hydrated="true"] {
  animation: dtool-hydrate 240ms ease-out;
}

@keyframes dtool-hydrate {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .dtool[data-hydrated="true"] {
    animation: none;
  }
  .output-surface--flash {
    box-shadow: none;
  }
  .dtool__status-dot--processing {
    animation: none;
  }
}
</style>
