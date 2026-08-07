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
import { computed, onMounted, ref } from 'vue'

// ─── Options ──────────────────────────────────────────────
const sortKeys = ref(false)
const indentSize = ref<2 | 4 | 'tab'>(2)

// ─── Helpers ──────────────────────────────────────────────
function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>).sort().reduce((acc, key) => {
      acc[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
      return acc
    }, {} as Record<string, unknown>)
  }
  return obj
}

function getIndent(): string | number {
  if (indentSize.value === 'tab') return '\t'
  return indentSize.value
}

// ─── Local state ──────────────────────────────────────────
const input = ref('')
const error = ref('')
const mode = ref<'format' | 'minify' | 'validate'>('format')
const copied = ref(false)
const hydrated = ref(false)

const output = computed(() => {
  if (!input.value.trim()) return ''
  if (mode.value === 'validate') return ''
  try {
    let parsed = JSON.parse(input.value)
    if (sortKeys.value) parsed = sortObjectKeys(parsed)
    if (mode.value === 'minify') return JSON.stringify(parsed)
    return JSON.stringify(parsed, null, getIndent())
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

const inputLines = computed(() => {
  if (!input.value.trim()) return 0
  return input.value.split('\n').length
})

const inputBytes = computed(() => new Blob([input.value]).size)

const outputLines = computed(() => {
  if (!output.value) return 0
  return output.value.split('\n').length
})

const outputBytes = computed(() => new Blob([output.value]).size)

// ─── Actions ──────────────────────────────────────────────
function format() {
  mode.value = 'format'
  error.value = ''
  if (!input.value.trim()) return
  try {
    let parsed = JSON.parse(input.value)
    if (sortKeys.value) parsed = sortObjectKeys(parsed)
    JSON.stringify(parsed, null, getIndent())
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

function minify() {
  mode.value = 'minify'
  error.value = ''
  if (!input.value.trim()) return
  try {
    let parsed = JSON.parse(input.value)
    if (sortKeys.value) parsed = sortObjectKeys(parsed)
    JSON.stringify(parsed)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

function doValidate() {
  mode.value = 'validate'
  error.value = ''
  if (!input.value.trim()) return
  try {
    JSON.parse(input.value)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

function doDownload() {
  if (!output.value) return
  const blob = new Blob([output.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function doCopy() {
  if (!output.value && mode.value !== 'validate') return
  const text = mode.value === 'validate' ? '✓ Valid JSON' : output.value
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
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function doClear() {
  input.value = ''
  error.value = ''
  mode.value = 'format'
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
  format()
}

onMounted(() => {
  hydrated.value = true
})
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
        <!-- Mode segments -->
        <div class="dtool__seg" role="radiogroup" aria-label="Format mode">
          <button type="button" class="dtool__seg-btn" :class="mode === 'format' && 'dtool__seg-btn--active'" @click="format">Format</button>
          <button type="button" class="dtool__seg-btn" :class="mode === 'minify' && 'dtool__seg-btn--active'" @click="minify">Minify</button>
          <button type="button" class="dtool__seg-btn" :class="mode === 'validate' && 'dtool__seg-btn--active'" @click="doValidate">Validate</button>
        </div>
      </div>
    </header>

    <!-- Editor grid ───────────────────────────────────────── -->
    <div class="dtool__workspace">
      <!-- Input ───────────────────────────────────────────── -->
      <section class="editor-card editor-card--input flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Input</span>
          <span class="text-sm text-muted font-mono">{{ inputLines }} line{{ inputLines !== 1 ? 's' : '' }} · {{ inputBytes }} B</span>
        </header>
        <textarea
          v-model="input"
          aria-label="JSON input"
          wrap="soft"
          placeholder='Paste your JSON here… e.g. {"hello": "world"}'
          spellcheck="false"
          class="w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>

      <!-- Output ──────────────────────────────────────────── -->
      <section class="editor-card editor-card--output flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">
            {{ mode === 'validate' ? 'Validation' : 'Output' }}
          </span>
          <span v-if="output" class="text-sm text-muted font-mono">
            {{ outputLines }} line{{ outputLines !== 1 ? 's' : '' }} · {{ outputBytes }} B
          </span>
          <span v-else-if="mode === 'validate' && isValid && input.trim()" class="text-sm text-primary-deep font-mono font-semibold">
            ✓ Valid JSON
          </span>
        </header>

        <!-- Successful output -->
        <pre
          v-if="output"
          class="output-surface relative rounded-xl bg-surface overflow-auto p-5 font-mono text-sm text-text leading-relaxed whitespace-pre-wrap m-0"
        ><code>{{ output }}</code></pre>

        <!-- Error output -->
        <div
          v-else-if="error"
          class="output-surface relative rounded-xl bg-surface overflow-auto p-5 border-danger"
          style="border-color: var(--color-error);"
        >
          <p class="text-sm font-semibold text-danger mb-2">Parse Error</p>
          <pre class="font-mono text-sm text-text leading-relaxed whitespace-pre-wrap m-0"><code>{{ error }}</code></pre>
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
      </section>

      <!-- Action bar ──────────────────────────────────────── -->
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6" role="toolbar" aria-label="Format actions">
        <button
          type="button"
          class="dtool__convert-btn"
          :disabled="!input.trim()"
          @click="format"
        >
          Format JSON
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
          <button type="button" class="dtool__pill" :disabled="!output" @click="doDownload">
            <span aria-hidden="true">⤓</span>
            Download
          </button>
          <span class="dtool__actionbar-sep" aria-hidden="true" />
          <button type="button" class="dtool__pill" @click="minify" :disabled="!input.trim()">
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

    <!-- Footer hint ───────────────────────────────────────── -->
    <footer class="text-xs text-muted font-mono">
      <span aria-hidden="true">⌘</span>
      Tip: Paste any JSON, then click <kbd>Format</kbd> or <kbd>Minify</kbd>. Invalid JSON shows the error inline.
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

.editor-card--input textarea {
  flex: 1 1 auto;
  min-height: 200px;
}

@media (min-width: 1280px) {
  .editor-card--input textarea { resize: none; }
}

/* ── Output surface ── */
.output-surface {
  border: 1px solid var(--color-outline-variant);
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
