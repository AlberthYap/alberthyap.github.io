<script setup lang="ts">
/**
 * CsvCleanerTool — Clean messy CSV data in the browser.
 *
 * Operations: trim whitespace, remove blank rows, deduplicate,
 * normalize quotes. Input is plain CSV text; output is the
 * cleaned CSV ready to copy or download.
 */
import { computed, ref } from 'vue'

// ─── State ────────────────────────────────────────────────
const input = ref('')
const trimOn = ref(true)
const blankOn = ref(true)
const dedupeOn = ref(true)
const dedupeInsensitive = ref(false)
const normalizeQuotes = ref(true)
const copied = ref(false)
const downloaded = ref(false)

// ─── Computeds ────────────────────────────────────────────

/** Split input into lines, preserving empty ones. */
const inputLines = computed<string[]>(() => {
  if (!input.value) return []
  return input.value.split('\n')
})

/** Cleaned output CSV string. */
const output = computed(() => {
  if (!input.value.trim()) return ''
  let lines = input.value.split('\n')

  // 1. Normalize quotes — strip surrounding double-quotes from each cell
  //    on every line, then re-quote cells that contain commas/newlines/quotes.
  if (normalizeQuotes.value) {
    lines = lines.map(normalizeLine)
  }

  // 2. Trim whitespace from each cell
  if (trimOn.value) {
    lines = lines.map(trimLine)
  }

  // 3. Remove blank/empty rows
  if (blankOn.value) {
    lines = lines.filter((line) => line.trim() !== '')
  }

  // 4. Deduplicate rows
  if (dedupeOn.value) {
    const seen = new Set<string>()
    lines = lines.filter((line) => {
      const key = dedupeInsensitive.value ? line.toLowerCase() : line
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  return lines.join('\n')
})

const linesRemoved = computed(() => inputLines.value.length - output.value.split('\n').filter(Boolean).length)

// ─── Helpers ──────────────────────────────────────────────

/** Split a CSV line into cells (quote-aware). */
function splitCells(line: string): string[] {
  const cells: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1)
      if (end === -1) { cells.push(line.slice(i)); break }
      cells.push(line.slice(i, end + 1))
      i = end + 1
      if (line[i] === ',') i++
    } else {
      const next = line.indexOf(',', i)
      if (next === -1) { cells.push(line.slice(i)); break }
      cells.push(line.slice(i, next))
      i = next + 1
    }
  }
  return cells
}

/** Trim whitespace from each cell in a line. */
function trimLine(line: string): string {
  return splitCells(line).map((c) => {
    const trimmed = c.trim()
    // re-quote if the cell was quoted before
    if (c.startsWith('"') && c.endsWith('"')) return `"${trimmed.slice(1, -1).trim()}"`
    return trimmed
  }).join(',')
}

/** Normalize quotes: strip outer quotes, re-add only if needed. */
function normalizeLine(line: string): string {
  return splitCells(line).map((cell) => {
    let inner = cell.trim()
    const wasQuoted = inner.startsWith('"') && inner.endsWith('"')
    if (wasQuoted) inner = inner.slice(1, -1)
    // Only quote if the value contains comma, newline, or quote
    if (inner.includes(',') || inner.includes('\n') || inner.includes('"')) {
      return `"${inner.replace(/"/g, '""')}"`
    }
    return inner
  }).join(',')
}

// ─── Actions ──────────────────────────────────────────────

function doClear() {
  input.value = ''
}

async function doCopy() {
  try {
    await navigator.clipboard.writeText(output.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = output.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function doDownload() {
  const blob = new Blob([output.value], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cleaned.csv'
  a.click()
  URL.revokeObjectURL(url)
  downloaded.value = true
  setTimeout(() => { downloaded.value = false }, 2000)
}

const SAMPLE = 'Name, Age, City\n" John ", 25, "New York"\n\n"Jane",,"London"\n" John ", 25, "New York"'
function loadSample() {
  input.value = SAMPLE
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Workspace divider -->
    <div class="dtool__section-divider" aria-hidden="true">
      <span class="dtool__section-divider-label font-mono text-label-sm uppercase tracking-widest text-muted">
        CSV Cleaner Workspace
      </span>
    </div>

    <!-- Header -->
    <header class="flex items-center justify-between gap-2 flex-wrap" style="min-height: 32px; padding: 0 2px 0.25rem">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary-soft text-primary-deep font-mono text-xs font-bold" aria-hidden="true">⌗</span>
        <span class="font-mono text-label-sm uppercase tracking-widest text-muted">CSV Cleaner</span>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="trimOn" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          Trim
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="blankOn" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          Drop blanks
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="dedupeOn" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          Unique rows
        </label>
        <label v-if="dedupeOn" class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none" style="padding-left:0">
          <input v-model="dedupeInsensitive" type="checkbox" class="w-3 h-3 accent-[var(--color-primary)]" />
          <span>a=A</span>
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="normalizeQuotes" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          Fix quotes
        </label>
      </div>
    </header>

    <!-- Quick start -->
    <button type="button" class="dtool__pill w-fit" @click="loadSample">
      <span aria-hidden="true">⌗</span>
      Try sample
    </button>

    <!-- Workspace grid -->
    <div class="csv-workspace">
      <!-- Input -->
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Input CSV</span>
          <span class="text-sm text-muted font-mono">{{ inputLines.length }} lines · {{ input.length }} chars</span>
        </header>
        <textarea
          v-model="input"
          aria-label="CSV input"
          wrap="off"
          spellcheck="false"
          placeholder="Paste messy CSV here…"
          class="w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>

      <!-- Output -->
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Cleaned CSV</span>
          <span
            v-if="output"
            class="text-sm text-muted font-mono"
          >
            {{ output.split('\n').filter(Boolean).length }} rows
            <template v-if="linesRemoved > 0">
              · <span class="text-primary-deep font-semibold">{{ linesRemoved }}</span> removed
            </template>
          </span>
        </header>

        <!-- Output pre -->
        <pre
          v-if="output"
          class="output-surface flex-1 min-h-0 rounded-xl bg-surface overflow-auto p-5 font-mono text-sm text-text leading-relaxed whitespace-pre"
        ><code>{{ output }}</code></pre>

        <!-- Empty state -->
        <div
          v-else
          class="output-empty flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center flex-1"
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
            <p class="text-base font-semibold text-text">Cleaned CSV will appear here</p>
            <p class="text-sm text-muted">Paste data on the left or try the sample above.</p>
          </div>
        </div>
      </section>

      <!-- Action bar -->
      <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="CSV cleaner actions">
        <button
          type="button"
          class="dtool__pill"
          :aria-pressed="copied"
          :disabled="!output"
          @click="doCopy"
        >
          <span aria-hidden="true">{{ copied ? '✓' : '⎘' }}</span>
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
        <button
          type="button"
          class="dtool__pill"
          :aria-pressed="downloaded"
          :disabled="!output"
          @click="doDownload"
        >
          <span aria-hidden="true">{{ downloaded ? '✓' : '⤓' }}</span>
          {{ downloaded ? 'Downloaded' : 'Download .csv' }}
        </button>
        <span class="dtool__actionbar-sep" aria-hidden="true" />
        <button type="button" class="dtool__pill" :disabled="!input" @click="doClear">
          <span aria-hidden="true">⌫</span>
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Workspace grid ── */
.csv-workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1280px) {
  .csv-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "input output"
      "actions actions";
    align-items: stretch;
    gap: 1rem;
  }
  .csv-workspace .editor-card:first-of-type { grid-area: input; }
  .csv-workspace .editor-card:nth-of-type(2) { grid-area: output; }
  .csv-workspace > div[role="toolbar"] { grid-area: actions; }
}

/* ── Shared styles (mirrors other tools) ── */

.dtool__section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0;
}

.dtool__section-divider::before,
.dtool__section-divider::after {
  content: '';
  flex: 1 1 auto;
  height: 1px;
  background: var(--color-outline-variant);
}

.dtool__section-divider-label {
  flex: 0 0 auto;
  opacity: 0.7;
}

.dtool__pill {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-outline-variant);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: background 150ms, border-color 150ms, color 150ms;
}

.dtool__pill:hover { border-color: var(--color-primary); color: var(--color-primary-deep); }
.dtool__pill:disabled { cursor: not-allowed; opacity: 0.5; background: var(--color-surface-container-low); border-color: var(--color-outline-variant); color: var(--color-muted); }
.dtool__pill:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.dtool__actionbar-sep {
  display: inline-block;
  width: 1px;
  height: 20px;
  background: var(--color-outline-variant);
  margin: 0 0.25rem;
  align-self: center;
}

.editor-card {
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: var(--color-surface);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 16px 16px 18px;
  box-shadow: 0 1px 0 color-mix(in oklab, rgb(255 255 255) 60%, transparent) inset, 0 4px 12px -8px color-mix(in oklab, var(--color-text) 8%, transparent);
}

.editor-card textarea {
  flex: 1 1 auto;
  min-height: 200px;
}

.output-surface {
  flex: 1 1 auto;
  min-height: 200px;
}

.output-empty {
  background: var(--color-surface-container-low);
  border: 1px dashed var(--color-outline-variant);
  border-radius: var(--radius-lg);
}

.output-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
}

@media (max-width: 639px) {
  .editor-card textarea { min-height: 200px; }
  .output-surface { min-height: 200px; }
  .dtool__section-divider { padding: 0 0 0.25rem; }
  .dtool__section-divider-label { font-size: 10px; }
}

@media (min-width: 640px) and (max-width: 1279px) {
  .editor-card textarea { min-height: 260px; }
  .output-surface { min-height: 260px; }
}
</style>
