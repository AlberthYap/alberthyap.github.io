<script setup lang="ts">
/**
 * YamlJsonTool — Convert between YAML and JSON in the browser.
 *
 * YAML → JSON: yaml.load → JSON.stringify(indent 2).
 * JSON → YAML: JSON.parse → yaml.dump.
 * Everything runs locally; no uploads.
 */
import { computed, ref } from 'vue'
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'

// ─── State ────────────────────────────────────────────────
type Direction = 'toJson' | 'toYaml'
const direction = ref<Direction>('toJson')
const input = ref('')
const copied = ref(false)
const downloaded = ref(false)

// ─── Computeds ────────────────────────────────────────────

const result = computed<{ ok: boolean; text: string; error?: string }>(() => {
  const src = input.value.trim()
  if (!src) return { ok: true, text: '' }

  try {
    if (direction.value === 'toJson') {
      const parsed = yamlLoad(src)
      // undefined = empty YAML document
      return { ok: true, text: JSON.stringify(parsed ?? null, null, 2) }
    }
    const parsed: unknown = JSON.parse(src)
    return { ok: true, text: yamlDump(parsed) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion failed'
    return { ok: false, text: '', error: message }
  }
})

const output = computed(() => result.value.text)
const errorMessage = computed(() => result.value.error ?? '')

const inputLabel = computed(() =>
  direction.value === 'toJson' ? 'Input YAML' : 'Input JSON',
)
const outputLabel = computed(() =>
  direction.value === 'toJson' ? 'JSON output' : 'YAML output',
)
const placeholder = computed(() =>
  direction.value === 'toJson'
    ? 'Paste YAML here…'
    : 'Paste JSON here…',
)
const downloadName = computed(() =>
  direction.value === 'toJson' ? 'converted.json' : 'converted.yaml',
)
const downloadType = computed(() =>
  direction.value === 'toJson' ? 'application/json' : 'text/yaml',
)

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
  const blob = new Blob([output.value], { type: downloadType.value })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName.value
  a.click()
  URL.revokeObjectURL(url)
  downloaded.value = true
  setTimeout(() => { downloaded.value = false }, 2000)
}

const SAMPLE_YAML = 'name: Ada Lovelace\nrole: Engineer\nactive: true\nskills:\n  - math\n  - programming'
const SAMPLE_JSON = '{\n  "name": "Ada Lovelace",\n  "role": "Engineer",\n  "active": true,\n  "skills": ["math", "programming"]\n}'

function loadSample() {
  input.value = direction.value === 'toJson' ? SAMPLE_YAML : SAMPLE_JSON
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Workspace divider -->
    <div class="dtool__section-divider" aria-hidden="true">
      <span class="dtool__section-divider-label font-mono text-label-sm uppercase tracking-widest text-muted">
        YAML ⇄ JSON Workspace
      </span>
    </div>

    <!-- Header: direction switch + status -->
    <header class="flex items-center justify-between gap-2 flex-wrap" style="min-height: 32px; padding: 0 2px 0.25rem">
      <div class="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Conversion direction">
        <button
          type="button"
          class="dtool__seg-btn"
          :class="direction === 'toJson' && 'dtool__seg-btn--active'"
          :aria-pressed="direction === 'toJson'"
          @click="direction = 'toJson'"
        >
          YAML → JSON
        </button>
        <button
          type="button"
          class="dtool__seg-btn"
          :class="direction === 'toYaml' && 'dtool__seg-btn--active'"
          :aria-pressed="direction === 'toYaml'"
          @click="direction = 'toYaml'"
        >
          JSON → YAML
        </button>
        <span
          v-if="errorMessage"
          class="text-xs font-mono text-[var(--color-error)]"
          role="alert"
        >
          {{ errorMessage }}
        </span>
      </div>
    </header>

    <!-- Quick start -->
    <button type="button" class="dtool__pill w-fit" @click="loadSample">
      <span aria-hidden="true">⌗</span>
      Try sample
    </button>

    <!-- Workspace grid -->
    <div class="yj-workspace">
      <!-- Input -->
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">{{ inputLabel }}</span>
          <span class="text-sm text-muted font-mono">{{ input.length }} chars</span>
        </header>
        <textarea
          v-model="input"
          :aria-label="inputLabel"
          wrap="off"
          spellcheck="false"
          :placeholder="placeholder"
          class="w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>

      <!-- Output -->
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">{{ outputLabel }}</span>
        </header>

        <pre
          v-if="output"
          class="output-surface flex-1 min-h-0 rounded-xl bg-surface overflow-auto p-5 font-mono text-sm text-text leading-relaxed whitespace-pre"
        ><code>{{ output }}</code></pre>

        <!-- Empty / error state -->
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
            <p v-if="errorMessage" class="text-base font-semibold text-text">Could not convert</p>
            <p v-else class="text-base font-semibold text-text">Converted output will appear here</p>
            <p class="text-sm text-muted">{{ errorMessage || 'Paste data on the left or try the sample above.' }}</p>
          </div>
        </div>
      </section>

      <!-- Action bar -->
      <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Conversion actions">
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
          {{ downloaded ? 'Downloaded' : 'Download' }}
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
.yj-workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1280px) {
  .yj-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "input output"
      "actions actions";
    align-items: stretch;
    gap: 1rem;
  }
  .yj-workspace .editor-card:first-of-type { grid-area: input; }
  .yj-workspace .editor-card:nth-of-type(2) { grid-area: output; }
  .yj-workspace > div[role="toolbar"] { grid-area: actions; }
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

.dtool__seg-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 7px 12px;
  border-radius: 8px;
  background: var(--color-surface-container-low);
  color: var(--color-text);
  border: 1px solid var(--color-outline-variant);
  cursor: pointer;
  transition: background 150ms, border-color 150ms, color 150ms;
}

.dtool__seg-btn:hover { border-color: var(--color-primary); }
.dtool__seg-btn--active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-deep);
  font-weight: 600;
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
