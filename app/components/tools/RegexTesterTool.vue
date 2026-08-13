<script setup lang="ts">
/**
 * RegexTesterTool — Live regex tester with highlighted matches, capture-group
 * breakdown, flag toggles and a quick-pattern cheatsheet.
 */
import { computed, ref, watch } from 'vue'

// Cap test-text size so a huge paste can't freeze the main thread while
// matching (audit H7). 100 KB covers realistic regex testing; larger
// inputs are rejected with an inline notice instead of silently parsed.
const MAX_TEST_TEXT = 100_000
const inputTooLarge = ref(false)

// ─── Common patterns ──────────────────────────────────────
const QUICK_PATTERNS = [
  { label: 'Email', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
  { label: 'URL', pattern: 'https?://[^\\s]+' },
  { label: 'IPv4', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
  { label: 'Hex color', pattern: '#[0-9a-fA-F]{3,8}' },
  { label: 'Date ISO', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { label: 'Phone (ID)', pattern: '\\+62\\d{9,12}' },
]

// ─── Local state ──────────────────────────────────────────
const testText = ref('')
const pattern = ref('')
const flagGlobal = ref(true)
const flagCaseInsensitive = ref(false)
const flagMultiline = ref(false)
const flagDotAll = ref(false)
const flagUnicode = ref(false)
const copiedMatches = ref(false)

const flags = computed(() => {
  let f = ''
  if (flagGlobal.value) f += 'g'
  if (flagCaseInsensitive.value) f += 'i'
  if (flagMultiline.value) f += 'm'
  if (flagDotAll.value) f += 's'
  if (flagUnicode.value) f += 'u'
  return f
})

// ─── Match engine ─────────────────────────────────────────

interface MatchInfo {
  index: number
  text: string
  groups: (string | undefined)[]
}

// Debounced live matching (audit H7): catastrophic-backtracking patterns
// still block the main thread inside a single `exec()`, but debouncing
// stops the freeze from re-triggering on every keystroke and the size
// cap above bounds the worst case. A Web Worker with a deadline would be
// the full fix; debounce + cap is the pragmatic improvement here.
const matches = ref<MatchInfo[]>([])
watch(
  [pattern, flags, testText],
  () => {
    if (!pattern.value.trim() || !testText.value) {
      matches.value = []
      return
    }
    if (testText.value.length > MAX_TEST_TEXT) {
      inputTooLarge.value = true
      matches.value = []
      return
    }
    inputTooLarge.value = false
    try {
      const re = new RegExp(pattern.value, flags.value)
      const results: MatchInfo[] = []
      let m: RegExpExecArray | null
      if (flags.value.includes('g')) {
        let safety = 0
        const max = 10_000
        while ((m = re.exec(testText.value)) !== null && safety < max) {
          safety++
          results.push({ index: m.index, text: m[0], groups: m.slice(1) })
          // Prevent infinite loops on zero-length matches (e.g. /.*/g)
          if (m[0] === '') re.lastIndex++
        }
      } else {
        m = re.exec(testText.value)
        if (m) results.push({ index: m.index, text: m[0], groups: m.slice(1) })
      }
      matches.value = results
    } catch {
      matches.value = []
    }
  },
  { immediate: true, flush: 'sync' },
)

const regexError = computed(() => {
  if (!pattern.value.trim()) return ''
  try {
    new RegExp(pattern.value, flags.value)
    return ''
  } catch (e) {
    return (e as Error).message
  }
})

// Matches count for the UI — previously `matches` was a computed.
const matchCount = computed(() => matches.value.length)

/** Escape user text for safe HTML insertion in v-html highlights. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlightedHtml = computed(() => {
  if (!testText.value || matches.value.length === 0) return ''
  const ms = matches.value
  // global matches can overlap if regex isn't well-behaved — sort by index
  const sorted = [...ms].sort((a, b) => a.index - b.index)
  let out = ''
  let last = 0
  for (const m of sorted) {
    out += escapeHtml(testText.value.slice(last, m.index))
    out += `<mark>${escapeHtml(m.text)}</mark>`
    last = m.index + m.text.length
  }
  out += escapeHtml(testText.value.slice(last))
  return out
})

// ─── Actions ──────────────────────────────────────────────

function doClear() {
  testText.value = ''
  pattern.value = ''
  inputTooLarge.value = false
}

async function doCopyMatches() {
  const lines = matches.value.map((m, i) => {
    const groups = m.groups.filter((g) => g !== undefined)
    if (groups.length) return `#${i + 1}: ${m.text}  [${groups.join(', ')}]`
    return `#${i + 1}: ${m.text}`
  })
  await copyText(lines.join('\n') || '(no matches)')
  copiedMatches.value = true
  setTimeout(() => { copiedMatches.value = false }, 2000)
}

async function copyText(text: string) {
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
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Workspace divider ─────────────────────────────────── -->
    <div class="dtool__section-divider" aria-hidden="true">
      <span class="dtool__section-divider-label font-mono text-label-sm uppercase tracking-widest text-muted">
        Regex Workspace
      </span>
    </div>

    <!-- Header ────────────────────────────────────────────── -->
    <header class="flex items-center justify-between gap-2 flex-wrap" style="min-height: 32px; padding: 0 2px 0.25rem">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary-soft text-primary-deep font-mono text-xs font-bold" aria-hidden="true">.*</span>
        <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Regex Tester</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- Flags -->
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="flagGlobal" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          <span>g</span>
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="flagCaseInsensitive" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          <span>i</span>
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="flagMultiline" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          <span>m</span>
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="flagDotAll" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          <span>s</span>
        </label>
        <label class="flex items-center gap-1 text-xs font-mono text-muted cursor-pointer select-none">
          <input v-model="flagUnicode" type="checkbox" class="w-3.5 h-3.5 accent-[var(--color-primary)]" />
          <span>u</span>
        </label>
        <span class="dtool__actionbar-sep" aria-hidden="true" />
        <button
          v-for="qp in QUICK_PATTERNS"
          :key="qp.label"
          type="button"
          class="dtool__seg-btn"
          @click="pattern = qp.pattern"
        >
          {{ qp.label }}
        </button>
      </div>
    </header>

    <!-- Workspace grid ────────────────────────────────────── -->
    <div class="regex-workspace">
      <!-- Test text ───────────────────────────────────────── -->
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Test Text</span>
          <span class="text-sm text-muted font-mono">{{ testText.length }} chars</span>
        </header>
        <textarea
          v-model="testText"
          aria-label="Test text"
          wrap="soft"
          spellcheck="false"
          placeholder="Paste or type text to test your regex against…"
          class="w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 font-mono text-[15px] text-text leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
        />
      </section>

      <!-- Pattern + results ───────────────────────────────── -->
      <section class="editor-card flex flex-col gap-3 min-w-0">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <span class="font-mono text-label-sm uppercase tracking-widest text-muted">Pattern &amp; Results</span>
          <span v-if="matches.length" class="text-sm text-muted font-mono">{{ matches.length }} match{{ matches.length !== 1 ? 'es' : '' }}</span>
          <span v-else-if="pattern.trim() && !regexError" class="text-sm text-muted font-mono">No matches</span>
        </header>

        <!-- Pattern input (styled like /pattern/flags) -->
        <div class="regex-pattern-row">
          <span class="regex-pattern-slash" aria-hidden="true">/</span>
          <input
            v-model="pattern"
            aria-label="Regex pattern"
            type="text"
            spellcheck="false"
            placeholder="pattern"
            class="regex-pattern-input"
          />
          <span class="regex-pattern-slash" aria-hidden="true">/</span>
          <span class="regex-pattern-flags" aria-hidden="true">{{ flags || 'g' }}</span>
        </div>

        <!-- Regex error -->
        <div
          v-if="regexError"
          class="rounded-xl p-4 font-mono text-sm"
          style="border: 1px solid var(--color-error); color: var(--color-error); background: color-mix(in oklab, var(--color-error) 8%, transparent)"
        >
          {{ regexError }}
        </div>

        <!-- Input too large (audit H7): refuse instead of freezing -->
        <div
          v-else-if="inputTooLarge"
          class="rounded-xl p-4 font-mono text-sm"
          style="border: 1px solid var(--color-error); color: var(--color-error); background: color-mix(in oklab, var(--color-error) 8%, transparent)"
        >
          Test text exceeds the {{ (MAX_TEST_TEXT / 1000).toFixed(0) }} KB safety limit. Trim it to run matching.
        </div>

        <!-- Highlighted preview -->
        <div
          v-else-if="highlightedHtml"
          class="regex-highlight rounded-xl border border-outline-variant bg-surface overflow-auto p-5 font-mono text-sm text-text leading-relaxed whitespace-pre-wrap"
        >
          <pre class="m-0 font-mono text-sm text-text leading-relaxed whitespace-pre-wrap" v-html="highlightedHtml" />
        </div>

        <!-- Match details list -->
        <div v-if="matches.length > 0" class="flex flex-col gap-2 mt-1">
          <div
            v-for="(m, i) in matches.slice(0, 50)"
            :key="i"
            class="regex-match-card rounded-lg border border-outline-variant bg-surface-container-low p-3 font-mono text-xs"
          >
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-primary-deep font-semibold">#{{ i + 1 }}</span>
              <span class="text-muted">index {{ m.index }}</span>
            </div>
            <code class="block text-sm text-text break-all">{{ m.text }}</code>
            <div v-if="m.groups.filter(g => g !== undefined).length">
              <div
                v-for="(g, gi) in m.groups"
                :key="gi"
                v-show="g !== undefined"
                class="mt-1 text-muted"
              >
                Group {{ gi + 1 }}:
                <code class="text-primary-deep">{{ g }}</code>
              </div>
            </div>
          </div>
          <p v-if="matches.length > 50" class="text-xs text-muted font-mono mt-1">
            … and {{ matches.length - 50 }} more matches
          </p>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="output-empty flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center flex-1"
        >
          <div class="output-empty__icon" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-base font-semibold text-text">Matches will appear here</p>
            <p class="text-sm text-muted">Type a pattern above and see live matches with capture groups.</p>
          </div>
        </div>
      </section>

      <!-- Action bar ──────────────────────────────────────── -->
      <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Regex actions">
        <button
          type="button"
          class="dtool__pill"
          :aria-pressed="copiedMatches"
          :disabled="!matches.length"
          @click="doCopyMatches"
        >
          <span aria-hidden="true">{{ copiedMatches ? '✓' : '⎘' }}</span>
          {{ copiedMatches ? 'Copied!' : 'Copy matches' }}
        </button>
        <span class="dtool__actionbar-sep" aria-hidden="true" />
        <button type="button" class="dtool__pill" @click="doClear" :disabled="!testText && !pattern">
          <span aria-hidden="true">⌫</span>
          Clear
        </button>
      </div>
    </div>

    <!-- Footer hint ───────────────────────────────────────── -->
    <footer class="text-xs text-muted font-mono">
      <span aria-hidden="true">⌘</span>
      Tip: Toggle flags above to change how the regex behaves. Global (<kbd>g</kbd>) finds all matches instead of just the first.
    </footer>
  </div>
</template>

<style scoped>
/* ── Workspace grid ── */
.regex-workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1280px) {
  .regex-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "text pattern"
      "actions actions";
    align-items: stretch;
    gap: 1rem;
  }
  .regex-workspace .editor-card:first-of-type { grid-area: text; }
  .regex-workspace .editor-card:nth-of-type(2) { grid-area: pattern; }
  .regex-workspace > div[role="toolbar"] { grid-area: actions; }
}

/* ── Pattern input row ── */
.regex-pattern-row {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-outline-variant);
  border-radius: 12px;
  background: var(--color-surface-container-low);
  overflow: hidden;
  transition: border-color 150ms, box-shadow 150ms;
}

.regex-pattern-row:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent);
}

.regex-pattern-slash {
  padding: 0 0.25rem 0 0.75rem;
  font-family: var(--font-mono);
  font-size: 16px;
  color: var(--color-muted);
  user-select: none;
}

.regex-pattern-slash + input + .regex-pattern-slash {
  padding: 0 0.5rem 0 0;
}

.regex-pattern-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 10px 6px;
  font-family: var(--font-mono);
  font-size: 15px;
  color: var(--color-text);
  outline: none;
}

.regex-pattern-input::placeholder { color: var(--color-muted); opacity: 0.7; }

.regex-pattern-flags {
  padding: 0 1rem 0 0.5rem;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-primary-deep);
  user-select: none;
}

/* ── Highlight preview ── */
.regex-highlight mark {
  background: color-mix(in oklab, var(--color-primary) 28%, transparent);
  color: var(--color-primary-deep);
  border-radius: 3px;
  padding: 0 1px;
}

/* ── Common patterns (styled as seg buttons) ── */
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

.dtool__seg-btn:disabled { opacity: 0.45; cursor: not-allowed; }

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

/* ── Editor card ── */
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

/* ── Mobile ── */
@media (max-width: 639px) {
  .editor-card textarea { min-height: 200px; }
  .dtool__section-divider { padding: 0 0 0.25rem; }
  .dtool__section-divider-label { font-size: 10px; }
}

@media (min-width: 640px) and (max-width: 1279px) {
  .editor-card textarea { min-height: 260px; }
}
</style>
