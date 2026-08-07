<script setup lang="ts">
/**
 * JsonFormatterTool — Browser-based JSON formatter, validator & minifier.
 *
 * Paste any JSON blob (pretty-printed, minified, or malformed),
 * format it with 2-space indent, minify it, or just validate
 * the syntax. Error messages point to the failing position.
 *
 * Layout: input | output side by side on xl, stacked on mobile.
 * No sidebar — this tool has zero configuration.
 */
import { computed, nextTick, ref } from 'vue'

import {
  analyzeJson,
  diffLines,
  flattenObject,
  parseCsv,
  queryPath,
  sortObjectKeys,
  stripEmptyFields,
  toCsv,
  unflattenObject,
  type DiffLine,
  type JsonStats,
} from '~/utils/jsonTools'

// ─── Types ────────────────────────────────────────────────
type Mode = 'format' | 'minify' | 'validate' | 'csv' | 'from-csv'
type FlattenMode = 'off' | 'flatten' | 'unflatten'

const flattenOptions: { value: FlattenMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'flatten', label: 'Flatten' },
  { value: 'unflatten', label: 'Unflatten' },
]

// ─── Options ──────────────────────────────────────────────
const sortKeys = ref(false)
const removeEmpty = ref(false)
const flattenMode = ref<FlattenMode>('off')
const indentSize = ref<2 | 4 | 'tab'>(2)

// ─── Helpers ──────────────────────────────────────────────
function getIndent(): string | number {
  if (indentSize.value === 'tab') return '\t'
  return indentSize.value
}

/** Parse input and apply all active transforms (sort, drop empty, flatten). 
/** Lazily parsed + transformed JSON object — cached across reactive computeds. */
const processed = computed(() => {
  if (!input.value.trim()) return null
  try {
    return getProcessed()
  } catch {
    return null
  }
})

/** Parse input and apply all active transforms (sort, drop empty, flatten). */
function getProcessed(): unknown {
  let parsed: unknown = JSON.parse(input.value)
  if (sortKeys.value) parsed = sortObjectKeys(parsed)
  if (removeEmpty.value) parsed = stripEmptyFields(parsed)
  const isPlainObject = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
  if (flattenMode.value === 'flatten' && isPlainObject) parsed = flattenObject(parsed)
  if (flattenMode.value === 'unflatten' && isPlainObject) parsed = unflattenObject(parsed as Record<string, unknown>)
  return parsed
}

// ─── Local state ──────────────────────────────────────────
const input = ref('')
const inputArea = ref<HTMLTextAreaElement | null>(null)
const inputGutterOffset = ref(0)
const error = ref('')
const mode = ref<Mode>('format')
const copied = ref(false)
const copiedEscaped = ref(false)

// jq-lite path filter (format/minify only)
const path = ref('')
// Compare mode
const compareMode = ref(false)
const compareA = ref('')
const compareB = ref('')
const compareFocus = ref<HTMLTextAreaElement | null>(null)
const diffResult = ref<DiffLine[] | null>(null)
const diffStats = ref({ added: 0, removed: 0 })

const output = computed(() => {
  if (!input.value.trim()) return ''
  if (mode.value === 'validate') return ''
  try {
    if (mode.value === 'from-csv') {
      return JSON.stringify(parseCsv(input.value), null, getIndent())
    }
    if (!processed.value) return ''
    if (mode.value === 'minify') return JSON.stringify(processed.value)
    if (mode.value === 'csv') return toCsv(processed.value)
    if (path.value.trim()) {
      const q = queryPath(processed.value, path.value)
      if (!q.ok) return ''
      return JSON.stringify(q.value, null, getIndent())
    }
    return JSON.stringify(processed.value, null, getIndent())
  } catch {
    return ''
  }
})

const isValid = computed(() => {
  if (!input.value.trim()) return false
  try {
    JSON.parse(input.value)
    return true
  } catch {
    return false
  }
})

/** Number of physical lines in the input (always ≥ 1 — "".split('\n') = ['']). */
const inputLines = computed(() => {
  return input.value.split('\n').length
})

/** [1..N] line numbers for the input gutter. */
const inputLineNumbers = computed(() => {
  return Array.from({ length: inputLines.value }, (_, i) => i + 1)
})

/** Keep the input gutter glued to the textarea while scrolling. */
function syncInputGutter() {
  inputGutterOffset.value = inputArea.value?.scrollTop ?? 0
}

const inputBytes = computed(() => new Blob([input.value]).size)

const outputLines = computed(() => {
  if (!output.value) return 0
  return output.value.split('\n').length
})

const outputBytes = computed(() => new Blob([output.value]).size)

/** [1..N] line numbers for the output gutter. */
const lineNumbers = computed(() => {
  const n = outputLines.value
  return Array.from({ length: n }, (_, i) => i + 1)
})

/** Keys / nodes / depth stats for the output strip (JSON outputs only). */
const jsonStats = computed<JsonStats | null>(() => {
  if (!output.value) return null
  if (mode.value === 'csv' || mode.value === 'from-csv') return null
  if (!processed.value) return null
  return analyzeJson(processed.value)
})

/** Path-expression error, computed live while typing. */
const pathError = computed(() => {
  if (mode.value !== 'format' && mode.value !== 'minify') return ''
  if (!path.value.trim() || !processed.value) return ''
  const q = queryPath(processed.value, path.value)
  return q.ok ? '' : q.error
})

/** CSV conversion error, computed live (both directions). */
const csvError = computed(() => {
  if (mode.value !== 'csv' && mode.value !== 'from-csv') return ''
  if (!input.value.trim()) return ''
  try {
    if (mode.value === 'from-csv') {
      parseCsv(input.value)
      return ''
    }
    if (!processed.value) {
      // Surface the JSON parse error that `processed` swallowed
      try { JSON.parse(input.value) } catch (e) { return (e as Error).message }
      return ''
    }
    if (!Array.isArray(processed.value)) return 'Input must be a JSON array of objects to convert to CSV.'
    toCsv(processed.value)
    return ''
  } catch (e) {
    return (e as Error).message
  }
})

/** Highest-priority error to surface in the output panel. */
const activeError = computed(() => csvError.value || pathError.value || error.value)

const convertLabel = computed(() => {
  switch (mode.value) {
    case 'csv': return 'To CSV'
    case 'from-csv': return 'From CSV'
    case 'minify': return 'Minify'
    case 'validate': return 'Validate'
    default: return 'Format JSON'
  }
})

// ─── Actions ──────────────────────────────────────────────
function selectMode(m: Mode) {
  mode.value = m
  error.value = ''
  if (!input.value.trim()) return
  try {
    if (m === 'from-csv') {
      parseCsv(input.value)
      return
    }
    const parsed = getProcessed()
    if (m === 'csv') {
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of objects to convert to CSV.')
      toCsv(parsed)
      return
    }
    if ((m === 'format' || m === 'minify') && path.value.trim()) {
      const q = queryPath(parsed, path.value)
      if (!q.ok) throw new Error(q.error)
    }
  } catch (e) {
    error.value = (e as Error).message
  }
}

/** CSS class for a diff line type. */
function diffClass(type: DiffLine['type']): string {
  if (type === 'add') return 'diff-line--add'
  if (type === 'del') return 'diff-line--del'
  return 'diff-line--same'
}

function doDownload() {
  if (!output.value) return
  const isCsv = mode.value === 'csv'
  const blob = new Blob([output.value], { type: isCsv ? 'text/csv;charset=utf-8' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isCsv ? 'converted.csv' : 'formatted.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older browsers / non-HTTPS
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

async function doCopy() {
  if (!output.value && mode.value !== 'validate') return
  const text = mode.value === 'validate' ? '✓ Valid JSON' : output.value
  await copyText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

/** Copy the output as a single escaped JSON string literal (for embedding in JS/HTML). */
async function copyEscaped() {
  if (!output.value) return
  await copyText(JSON.stringify(output.value))
  copiedEscaped.value = true
  setTimeout(() => { copiedEscaped.value = false }, 2000)
}

function doClear() {
  input.value = ''
  error.value = ''
  mode.value = 'format'
}

// ─── Compare mode ─────────────────────────────────────────
function runDiff() {
  const result = diffLines(
    compareA.value.replace(/\n$/, '').split('\n'),
    compareB.value.replace(/\n$/, '').split('\n'),
  )
  diffResult.value = result
  diffStats.value = {
    added: result.filter((l) => l.type === 'add').length,
    removed: result.filter((l) => l.type === 'del').length,
  }
}

function loadCompareSample() {
  compareA.value = JSON.stringify({
    name: 'Alberth Yap',
    role: 'Frontend Engineer',
    skills: ['Vue.js', 'Nuxt', 'TypeScript', 'Go'],
    yearsOfExperience: 7,
  }, null, 2)
  compareB.value = JSON.stringify({
    name: 'Alberth Yap',
    role: 'Senior Frontend Engineer',
    skills: ['Vue.js', 'Nuxt', 'TypeScript', 'Go', 'Docker'],
    yearsOfExperience: 8,
  }, null, 2)
  runDiff()
}

function exitCompare() {
  compareMode.value = false
  diffResult.value = null
}

/** Toggle compare mode: clear stale diff on exit, move focus on entry. */
function toggleCompare() {
  compareMode.value = !compareMode.value
  if (!compareMode.value) {
    diffResult.value = null
    return
  }
  nextTick(() => compareFocus.value?.focus())
}

function loadSample() {
  input.value = JSON.stringify({
    name: 'Alberth Yap',
    role: 'Frontend Engineer',
    skills: ['Vue.js', 'Nuxt', 'TypeScript', 'Go'],
    location: { city: 'Jakarta', country: 'Indonesia' },
    yearsOfExperience: 7,
    openToWork: true,
  }, null, 2)
  selectMode('format')
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Workspace divider ─────────────────────────────────── -->
    <div class="dtool__section-divider" aria-hidden="true">
      <span class="dtool__section-divider-label font-mono text-label-sm uppercase tracking-widest text-muted">
        JSON Workspace
      </span>
    </div>

    <!-- Header ────────────────────────────────────────────── -->
    <header class="flex items-center justify-between gap-2 flex-wrap" style="min-height: 32px; padding: 0 2px 0.25rem;">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary-soft text-primary-deep font-mono text-xs font-bold" aria-hidden="true">{ }</span>
        <span class="font-mono text-label-sm uppercase tracking-widest text-muted">JSON Formatter</span>
        <!-- Indent selector -->
        <div class="dtool__seg" role="radiogroup" aria-label="Indent size">
          <button
            v-for="opt in [{k: 2, l: '2'}, {k: 4, l: '4'}, {k: 'tab' as const, l: 'Tab'}]"
            :key="opt.k"
            type="button"
            class="dtool__seg-btn"
            :class="indentSize === opt.k && 'dtool__seg-btn--active'"
            @click="indentSize = opt.k"
          >
            {{ opt.l }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Sort keys toggle -->
        <label class="flex items-center gap-1.5 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="sortKeys" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]">
          Sort keys
        </label>
        <!-- Drop empty toggle -->
        <label class="flex items-center gap-1.5 text-xs font-mono text-muted cursor-pointer select-none" title="Remove null, empty strings, arrays and objects">
          <input v-model="removeEmpty" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]">
          Drop empty
        </label>
        <!-- Flatten control -->
        <div class="dtool__seg" role="radiogroup" aria-label="Flatten keys">
          <button
            v-for="opt in flattenOptions"
            :key="opt.value"
            type="button"
            class="dtool__seg-btn"
            :class="flattenMode === opt.value && 'dtool__seg-btn--active'"
            @click="flattenMode = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <!-- Mode segments -->
        <div class="dtool__seg" role="radiogroup" aria-label="Format mode">
          <button type="button" class="dtool__seg-btn" :class="mode === 'format' && 'dtool__seg-btn--active'" @click="selectMode('format')">Format</button>
          <button type="button" class="dtool__seg-btn" :class="mode === 'minify' && 'dtool__seg-btn--active'" @click="selectMode('minify')">Minify</button>
          <button type="button" class="dtool__seg-btn" :class="mode === 'validate' && 'dtool__seg-btn--active'" @click="selectMode('validate')">Validate</button>
          <button type="button" class="dtool__seg-btn" :class="mode === 'csv' && 'dtool__seg-btn--active'" @click="selectMode('csv')">To CSV</button>
          <button type="button" class="dtool__seg-btn" :class="mode === 'from-csv' && 'dtool__seg-btn--active'" @click="selectMode('from-csv')">From CSV</button>
        </div>
        <!-- Compare toggle -->
        <button
          type="button"
          class="dtool__pill"
          :class="compareMode && 'dtool__pill--active'"
          :aria-pressed="compareMode"
          @click="toggleCompare"
        >
          <span aria-hidden="true">⇄</span>
          Compare
        </button>
      </div>
    </header>

    <!-- Editor grid ───────────────────────────────────────── -->
    <template v-if="!compareMode">
      <!-- Path filter (jq-lite) -->
      <div v-if="mode === 'format' || mode === 'minify'" class="dtool-path">
        <label for="json-path" class="shrink-0">Path</label>
        <input
          id="json-path"
          v-model="path"
          type="text"
          spellcheck="false"
          placeholder='$.users[*].name — leave empty for the full document'
        />
        <button v-if="path" type="button" class="dtool__pill" aria-label="Clear path" @click="path = ''">×</button>
      </div>

    <div class="dtool__workspace">
      <!-- Input ───────────────────────────────────────────── -->
      <section class="editor-card editor-card--input flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Input</span>
          <span class="text-sm text-muted font-mono">{{ inputLines }} line{{ inputLines !== 1 ? 's' : '' }} · {{ inputBytes }} B</span>
        </header>
        <div class="input-editor">
          <div class="input-gutter" aria-hidden="true">
            <div class="input-gutter__inner" :style="{ transform: `translateY(${-inputGutterOffset}px)` }">
              <span v-for="n in inputLineNumbers" :key="n">{{ n }}</span>
            </div>
          </div>
          <textarea
            ref="inputArea"
            v-model="input"
            aria-label="JSON input"
            wrap="off"
            placeholder='Paste your JSON here… e.g. {"hello": "world"}'
            spellcheck="false"
            @scroll="syncInputGutter"
            class="input-textarea"
          />
        </div>
      </section>

      <!-- Output ──────────────────────────────────────────── -->
      <section class="editor-card editor-card--output flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">
            {{ mode === 'validate' ? 'Validation' : mode === 'csv' ? 'CSV Output' : 'Output' }}
          </span>
          <span v-if="output" class="text-sm text-muted font-mono">
            {{ outputLines }} line{{ outputLines !== 1 ? 's' : '' }} · {{ outputBytes }} B
          </span>
          <span v-else-if="mode === 'validate' && isValid && input.trim()" class="text-sm text-primary-deep font-mono font-semibold">
            ✓ Valid JSON
          </span>
        </header>

        <!-- Successful output with line-number gutter -->
        <div
          v-if="output"
          class="output-surface relative rounded-xl bg-surface overflow-auto m-0"
        >
          <div class="output-lines">
            <div class="line-gutter" aria-hidden="true">
              <span v-for="n in lineNumbers" :key="n">{{ n }}</span>
            </div>
            <pre class="output-code m-0 font-mono text-sm text-text leading-relaxed"><code>{{ output }}</code></pre>
          </div>
        </div>

        <!-- Error output -->
        <div
          v-else-if="activeError"
          class="output-surface relative rounded-xl bg-surface overflow-auto p-5"
          style="border-color: var(--color-error);"
        >
          <p class="text-sm font-semibold text-danger mb-2">Error</p>
          <pre class="font-mono text-sm text-text leading-relaxed whitespace-pre-wrap m-0"><code>{{ activeError }}</code></pre>
        </div>

        <!-- Validation success (no output, just valid) -->
        <div
          v-else-if="mode === 'validate' && isValid && input.trim()"
          class="output-empty flex flex-col items-center justify-center gap-3 rounded-xl p-8 text-center"
        >
          <div class="output-empty__icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p class="text-base font-semibold text-primary-deep">Valid JSON</p>
          <p class="text-sm text-muted">No syntax errors found.</p>
        </div>

        <!-- Empty state -->
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
            <p class="text-base font-semibold text-text">Formatted JSON will appear here</p>
            <p class="text-sm text-muted">Paste JSON on the left, or start with a sample.</p>
          </div>
          <button type="button" class="dtool__pill dtool__pill--primary" @click="loadSample">
            <span aria-hidden="true">⌗</span>
            Try sample
          </button>
        </div>

        <!-- Stats strip ──────────────────────────────────── -->
        <div v-if="jsonStats" class="json-stats">
          <span>Keys <strong>{{ jsonStats.keys }}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Nodes <strong>{{ jsonStats.nodes }}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Depth <strong>{{ jsonStats.depth }}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Size <strong>{{ outputBytes }} B</strong></span>
        </div>
      </section>

      <!-- Action bar ──────────────────────────────────────── -->
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6" role="toolbar" aria-label="Format actions">
        <button
          type="button"
          class="dtool__convert-btn"
          :disabled="!input.trim()"
          @click="selectMode(mode)"
        >
          {{ convertLabel }}
        </button>

        <div class="flex flex-wrap items-center gap-2">
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
            :aria-pressed="copiedEscaped"
            :disabled="!output"
            @click="copyEscaped"
          >
            <span aria-hidden="true">{{ copiedEscaped ? '✓' : '⎘' }}</span>
            {{ copiedEscaped ? 'Copied!' : 'Escaped' }}
          </button>
          <button type="button" class="dtool__pill" :disabled="!output" @click="doDownload">
            <span aria-hidden="true">⤓</span>
            Download
          </button>
          <span class="dtool__actionbar-sep" aria-hidden="true" />
          <button type="button" class="dtool__pill" @click="selectMode('minify')" :disabled="!input.trim()">
            <span aria-hidden="true">↔</span>
            Minify
          </button>
          <button type="button" class="dtool__pill" @click="doClear" :disabled="!input">
            <span aria-hidden="true">⌫</span>
            Clear
          </button>
        </div>
      </div>
    </div>
    </template>

    <!-- Compare mode ─────────────────────────────────────── -->
    <section v-else class="compare-panel">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Compare JSON</span>
        <button type="button" class="dtool__pill" @click="exitCompare">
          <span aria-hidden="true">←</span>
          Back to formatter
        </button>
      </div>

      <div class="compare-grid">
        <div class="editor-card flex flex-col gap-3 min-w-0">
          <header class="flex items-center justify-between gap-3 flex-wrap">
            <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Original</span>
          </header>
          <textarea
            ref="compareFocus"
            v-model="compareA"
            aria-label="Original JSON for comparison"
            spellcheck="false"
            placeholder='Paste the original JSON…'
          />
        </div>
        <div class="editor-card flex flex-col gap-3 min-w-0">
          <header class="flex items-center justify-between gap-3 flex-wrap">
            <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Changed</span>
          </header>
          <textarea
            v-model="compareB"
            aria-label="Changed JSON for comparison"
            spellcheck="false"
            placeholder='Paste the changed JSON…'
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="dtool__convert-btn"
          :disabled="!compareA.trim() && !compareB.trim()"
          @click="runDiff"
        >
          Compare
        </button>
        <button type="button" class="dtool__pill" @click="loadCompareSample">
          <span aria-hidden="true">⌗</span>
          Try sample
        </button>
        <span v-if="diffResult" class="text-sm text-muted font-mono">
          {{ diffStats.added }} added · {{ diffStats.removed }} removed
        </span>
      </div>

      <div v-if="diffResult" class="diff-surface" role="region" aria-label="Diff result">
        <div v-for="(line, i) in diffResult" :key="i" class="diff-line" :class="diffClass(line.type)">
          <span class="diff-marker" aria-hidden="true">{{ line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ' }}</span>{{ line.text }}
        </div>
      </div>
      <div
        v-else
        class="output-empty flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center"
      >
        <div class="output-empty__icon" aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-base font-semibold text-text">Diff will appear here</p>
          <p class="text-sm text-muted">Paste two JSON documents and click Compare.</p>
        </div>
      </div>
    </section>

    <!-- Footer hint ───────────────────────────────────────── -->
    <footer class="text-xs text-muted font-mono">
      <span aria-hidden="true">⌘</span>
      Tip: Pick a mode, then optionally sort keys, drop empty fields, flatten, or drill in with the Path box. Compare mode diffs two documents.
    </footer>
  </div>
</template>

<style scoped>
/* ── Shared workspace layout (mirrors DelimiterTool.vue) ── */

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

.dtool__workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dtool__workspace .editor-card--input { order: 1; }
.dtool__workspace .editor-card--output { order: 2; }
.dtool__workspace > div[role="toolbar"] { order: 3; }

@media (min-width: 1280px) {
  .dtool__workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "input output"
      "actions actions";
    align-items: stretch;
    gap: 1rem;
  }
  .dtool__workspace .editor-card--input { grid-area: input; order: 0; }
  .dtool__workspace .editor-card--output { grid-area: output; order: 0; }
  .dtool__workspace > div[role="toolbar"] { grid-area: actions; order: 0; }
}

/* ── Mobile editor heights ── */
@media (max-width: 639px) {
  textarea { min-height: 200px; }
  .output-surface,
  .output-empty {
    min-height: 200px;
  }
  .dtool__section-divider {
    padding: 0 0 0.25rem;
  }
  .dtool__section-divider-label {
    font-size: 10px;
  }
}

@media (min-width: 640px) and (max-width: 1279px) {
  textarea { min-height: 260px; }
  .output-surface,
  .output-empty {
    min-height: 260px;
  }
}

/* ── Shared pill/button styles (match DelimiterTool.vue) ── */

.dtool__seg {
  display: inline-flex !important;
  flex-wrap: wrap !important;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-outline-variant);
}

.dtool__seg-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 0.45rem 0.8rem;
  border-radius: 10px;
  background: transparent;
  color: var(--color-muted);
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background-color 150ms, color 150ms;
}

.dtool__seg-btn:hover { color: var(--color-text); }
.dtool__seg-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.dtool__seg-btn--active {
  background: var(--color-surface);
  color: var(--color-primary-deep);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.4) inset;
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
.dtool__pill--primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.dtool__pill--primary:hover { background: var(--color-primary-deep); border-color: var(--color-primary-deep); color: #fff; }
.dtool__pill--active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-deep);
}

/* ── Path filter row ── */
.dtool-path {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-muted);
}

.dtool-path input {
  flex: 1 1 auto;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-low);
  color: var(--color-text);
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}

.dtool-path input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent);
}

.dtool-path input::placeholder { color: var(--color-muted); opacity: 0.7; }

/* ── Compare panel ── */
.compare-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.compare-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1280px) {
  .compare-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.compare-grid textarea {
  width: 100%;
  min-height: 240px;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.625;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-low);
  color: var(--color-text);
  outline: none;
}

.compare-grid textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent);
}

.diff-surface {
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  overflow: auto;
  max-height: 480px;
}

.diff-line {
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.625;
  padding: 1px 1rem;
  white-space: pre;
}

.diff-marker {
  display: inline-block;
  width: 1.2em;
  user-select: none;
  -webkit-user-select: none;
  color: var(--color-muted);
}

.diff-line--same { color: var(--color-text); }
.diff-line--add { background: color-mix(in oklab, #2e7d32 16%, transparent); color: var(--color-text); }
.diff-line--del { background: color-mix(in oklab, #c62828 16%, transparent); color: var(--color-text); }

.dtool__convert-btn {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 12px 28px;
  border-radius: 999px;
  border: 0;
  background: var(--color-button-primary, #386948);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px -4px color-mix(in oklab, var(--color-button-primary) 40%, transparent), 0 1px 0 rgba(255,255,255,0.12) inset;
  transition: background 150ms, transform 150ms, box-shadow 150ms;
}

.dtool__convert-btn:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-button-primary) 88%, #000);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px -6px color-mix(in oklab, var(--color-button-primary) 50%, transparent), 0 1px 0 rgba(255,255,255,0.12) inset;
}

.dtool__convert-btn:active:not(:disabled) { transform: translateY(0); }
.dtool__convert-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; }
.dtool__convert-btn:disabled { cursor: not-allowed; opacity: 0.5; background: var(--color-surface-container-low); color: var(--color-muted); box-shadow: none; }

.dtool__actionbar-sep {
  display: inline-block;
  width: 1px;
  height: 20px;
  background: var(--color-outline-variant);
  margin: 0 0.25rem;
  align-self: center;
}

/* ── Editor cards ── */
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

/* ── Input editor with line-number gutter ── */
.input-editor {
  flex: 1 1 auto;
  display: flex;
  align-items: stretch;
  min-height: 200px;
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  background: var(--color-surface-container-low);
  overflow: hidden;
  transition: border-color 150ms, box-shadow 150ms;
}

.input-editor:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent);
}

.input-gutter {
  flex-shrink: 0;
  overflow: hidden;
  padding: 1.25rem 0.75rem 1.25rem 1.25rem;
  border-right: 1px solid var(--color-outline-variant);
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.625;
  text-align: right;
  user-select: none;
  -webkit-user-select: none;
  opacity: 0.85;
}

.input-gutter__inner {
  display: flex;
  flex-direction: column;
}

.input-textarea {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 200px;
  border: 0;
  background: transparent;
  padding: 1.25rem 1.25rem 1.25rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.625;
  color: var(--color-text);
  white-space: pre;
  overflow: auto;
  outline: none;
  resize: none;
}

.input-textarea::placeholder { color: var(--color-muted); opacity: 0.7; }

@media (min-width: 1280px) {
  .input-editor { min-height: 0; }
}

/* ── Output surface ── */
.output-surface {
  border: 1px solid var(--color-outline-variant);
}

/* Line-number gutter + code column */
.output-lines {
  display: flex;
  align-items: stretch;
}

.line-gutter {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 1.25rem 0.75rem 1.25rem 1.25rem;
  border-right: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-low);
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.625;
  text-align: right;
  user-select: none;
  -webkit-user-select: none;
  opacity: 0.85;
}

.output-code {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
  padding: 1.25rem;
  white-space: pre;
  font-size: 14px;
  line-height: 1.625;
}

/* Stats strip under the output */
.json-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-muted);
}

.json-stats strong {
  color: var(--color-text);
  font-weight: 600;
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
</style>
