<script setup lang="ts">
/**
 * TextDiffTool — Compare two texts line-by-line with LCS diff.
 *
 * Uses the shared `diffLines()` from `~/utils/jsonTools` which powers
 * both the JSON Formatter's Compare mode and this standalone tool.
 */
import { computed, ref } from 'vue'
import { diffLines, type DiffLine } from '~/utils/jsonTools'

// ─── State ────────────────────────────────────────────────
const original = ref('')
const changed = ref('')
const copied = ref(false)

// ─── Computeds ────────────────────────────────────────────

const diffResult = computed<DiffLine[]>(() => {
  if (!original.value.trim() && !changed.value.trim()) return []
  const a = original.value.replace(/\n$/, '').split('\n')
  const b = changed.value.replace(/\n$/, '').split('\n')
  return diffLines(a, b)
})

const stats = computed(() => {
  const added = diffResult.value.filter((d) => d.type === 'add').length
  const removed = diffResult.value.filter((d) => d.type === 'del').length
  const unchanged = diffResult.value.filter((d) => d.type === 'same').length
  return { added, removed, unchanged }
})

const diffClass = (type: DiffLine['type']) => ({
  'diff-line--add': type === 'add',
  'diff-line--del': type === 'del',
  'diff-line--same': type === 'same',
})

const diffPrefix = (type: DiffLine['type']) => {
  if (type === 'add') return '+'
  if (type === 'del') return '-'
  return ' '
}

// ─── Actions ──────────────────────────────────────────────

function doClear() {
  original.value = ''
  changed.value = ''
}

function doSwap() {
  const tmp = original.value
  original.value = changed.value
  changed.value = tmp
}

async function doCopy() {
  const lines = diffResult.value.map((d) => `${diffPrefix(d.type)} ${d.text}`)
  const text = lines.join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
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

const SAMPLE_A = 'The quick brown fox\njumps over the lazy dog\nnear the riverbank.'
const SAMPLE_B = 'The quick brown fox\nleaps over the lazy dog\nnear the riverbank.\nA new line appears.'
function loadSample() {
  original.value = SAMPLE_A
  changed.value = SAMPLE_B
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Workspace divider -->
    <div class="dtool__section-divider" aria-hidden="true">
      <span class="dtool__section-divider-label font-mono text-label-sm uppercase tracking-widest text-muted">
        Diff Workspace
      </span>
    </div>

    <!-- Header -->
    <header class="flex items-center justify-between gap-2 flex-wrap" style="min-height: 32px; padding: 0 2px 0.25rem">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary-soft text-primary-deep font-mono text-xs font-bold" aria-hidden="true">≍</span>
        <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Text Diff</span>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="dtool__seg-btn" @click="doSwap" title="Swap original and changed">
          ⇄ Swap
        </button>
        <button type="button" class="dtool__seg-btn" @click="loadSample">
          ⌗ Sample
        </button>
      </div>
    </header>

    <!-- Inputs row -->
    <div class="diff-inputs">
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Original</span>
          <span class="text-sm text-muted font-mono">{{ original.split('\n').length }} lines</span>
        </header>
        <textarea
          v-model="original"
          aria-label="Original text"
          wrap="off"
          spellcheck="false"
          placeholder="Paste the original text…"
          class="w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>

      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Changed</span>
          <span class="text-sm text-muted font-mono">{{ changed.split('\n').length }} lines</span>
        </header>
        <textarea
          v-model="changed"
          aria-label="Changed text"
          wrap="off"
          spellcheck="false"
          placeholder="Paste the changed text…"
          class="w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>
    </div>

    <!-- Diff output -->
    <section class="editor-card flex flex-col gap-3 min-w-0">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Diff</span>
        <span v-if="diffResult.length" class="text-sm text-muted font-mono">
          <span class="text-green-600 dark:text-green-400">+{{ stats.added }}</span>
          &nbsp;
          <span class="text-red-600 dark:text-red-400">-{{ stats.removed }}</span>
          &nbsp;{{ stats.unchanged }} unchanged
        </span>
      </header>

      <!-- Diff lines -->
      <pre
        v-if="diffResult.length"
        class="output-surface flex-1 min-h-0 rounded-xl bg-surface overflow-auto p-5 font-mono text-sm leading-relaxed m-0"
      ><code><template v-for="(line, i) in diffResult" :key="i">
        <span :class="diffClass(line.type)" class="diff-line">{{ diffPrefix(line.type) }} {{ line.text }}</span>
</template></code></pre>

      <!-- Empty state -->
      <div
        v-else
        class="output-empty flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center flex-1"
      >
        <div class="output-empty__icon" aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M3 12h18" />
          </svg>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-base font-semibold text-text">Diff will appear here</p>
          <p class="text-sm text-muted">Paste text in both panels above or try the sample.</p>
        </div>
      </div>
    </section>

    <!-- Action bar -->
    <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Diff actions">
      <button
        type="button"
        class="dtool__pill"
        :aria-pressed="copied"
        :disabled="!diffResult.length"
        @click="doCopy"
      >
        <span aria-hidden="true">{{ copied ? '✓' : '⎘' }}</span>
        {{ copied ? 'Copied!' : 'Copy unified diff' }}
      </button>
      <span class="dtool__actionbar-sep" aria-hidden="true" />
      <button type="button" class="dtool__pill" :disabled="!original && !changed" @click="doClear">
        <span aria-hidden="true">⌫</span>
        Clear
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Inputs row ── */
.diff-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .diff-inputs {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
  }
}

/* ── Diff lines ── */
.diff-line {
  display: block;
  padding: 0 8px;
  min-height: 1.625em;
}

.diff-line--add {
  background: color-mix(in oklab, #2e7d32 16%, transparent);
  color: var(--color-text);
}

.diff-line--del {
  background: color-mix(in oklab, #c62828 16%, transparent);
  color: var(--color-text);
}

.diff-line--same {
  color: var(--color-muted);
}

/* ── Shared (mirrors other tools) ── */

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

.dtool__seg-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  background: var(--color-surface-container-low);
  color: var(--color-muted);
  border: 1px solid var(--color-outline-variant);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background 150ms, border-color 150ms, color 150ms;
}

.dtool__seg-btn:hover { border-color: var(--color-primary); color: var(--color-primary-deep); }
.dtool__seg-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

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

.editor-card textarea { flex: 1 1 auto; min-height: 200px; }

.output-surface { flex: 1 1 auto; min-height: 200px; }

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

@media (min-width: 640px) and (max-width: 1023px) {
  .editor-card textarea { min-height: 220px; }
  .output-surface { min-height: 220px; }
}
</style>
