/**
 * useDelimiterStore — Browser-based delimiter converter & data
 * transformer state + behaviour, extracted from the original
 * monolithic `DelimiterTool.vue` script-setup into one cohesive
 * factory composable. Each `useDelimiterStore()` invocation creates
 * a fresh state graph (matches the test pattern of mounting a fresh
 * `DelimiterTool` component per test); all behaviour lives here so
 * the component file only handles rendering + DOM wiring.
 *
 * Scope:
 *   • State         — input / mode / delimiters / output format /
 *                      transform refs (trim, dedupe, sort, reverse,
 *                      …) / advanced / history / UX feedback refs
 *                      (outputFlash, dedupeNotice, dedupePulse,
 *                      downloaded, autoDetectResult).
 *   • Helpers       — resolveDelim, detectDelim, splitLine, doJoin,
 *                      parseRaw (pure functions).
 *   • Computeds     — transformed (transform pipeline), output, all
 *                      stats (rowCount, colCount, inputLineCount,
 *                      inputBytes, outputBytes, formatLabel,
 *                      activeTransformCount).
 *   • Actions       — autoDetect, doCopy, doDownload, clearInput,
 *                      resetTransforms, loadSample,
 *                      loadJoinSample, cycleSortDir.
 *   • History       — load/save/push/restore/clear + formatTime +
 *                      summary (auto-save debounced 2 s after
 *                      typing via watch).
 *   • UX feedback   — pulseDedupe, showDedupeNotice (dedupe-aware
 *                      prev-row-count tracking from onMounted seed).
 *   • Animations    — outputFlash (600 ms), dedupePulse (700 ms),
 *                      autoDetectResult (2.5 s toast).
 *   • Keyboard      — onKeydown returns the Cmd/Ctrl+Enter and
 *                      Cmd/Ctrl+Shift+C copy handlers; caller binds
 *                      it to a DOM node.
 *
 * Conventions: identical to other project composables — no module-
 * level state, closure-local timers/flags so per-component instances
 * are fully isolated. Public API surface is destructured by the
 * consuming component.
 *
 * NOT in this composable (intentionally):
 *   • The DOM ref to the tool root (containerRef) — owned by
 *     `DelimiterTool.vue` because it binds to a template element.
 *     The caller attaches `onKeydown` to whatever DOM ref it owns.
 *   • All visual styling — scoped to each consuming component.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// ─── Types ─────────────────────────────────────────────────
export type DelimPreset = 'comma' | 'tab' | 'semicolon' | 'pipe' | 'space' | 'custom'
export type Mode = 'split' | 'join'
export type OutFormat = 'table' | 'json-array' | 'json-objects' | 'delimited'
export type SortDir = 'asc' | 'desc'
export type QuoteOp = 'none' | 'add' | 'remove'

export interface HistoryEntry {
  input: string
  mode: Mode
  inDelim: DelimPreset
  customInDelim: string
  outDelim: DelimPreset
  outFormat: OutFormat
  ts: number
}

// ─── Constants (shared, immutable) ────────────────────────
const DELIM_MAP: Record<DelimPreset, string> = {
  comma: ',', tab: '\t', semicolon: ';', pipe: '|', space: ' ', custom: '',
}
const DELIM_OPTIONS: { key: DelimPreset; label: string; char: string }[] = [
  { key: 'comma', label: 'Comma', char: ',' },
  { key: 'tab', label: 'Tab', char: '⇥' },
  { key: 'semicolon', label: 'Semi', char: ';' },
  { key: 'pipe', label: 'Pipe', char: '|' },
  { key: 'space', label: 'Space', char: '␣' },
  { key: 'custom', label: 'Custom…', char: '…' },
]

const FORMAT_LABELS: Record<OutFormat, string> = {
  table: 'Table',
  delimited: 'Delimited',
  'json-array': 'JSON · Array',
  'json-objects': 'JSON · Objects',
}

const HISTORY_KEY = 'delimiter-tool-history'
const MAX_HISTORY = 20

// ─── Composable factory ────────────────────────────────────
export function useDelimiterStore() {
  // ─── State ───────────────────────────────────────
  const input = ref('')
  const mode = ref<Mode>('join')
  const inDelim = ref<DelimPreset>('comma')
  const customInDelim = ref('')
  const outDelim = ref<DelimPreset>('comma')
  const customOutDelim = ref('')
  const outFormat = ref<OutFormat>('table')
  const copied = ref(false)
  const downloaded = ref(false)

  // Transforms (input-row options)
  const trimOn = ref(true)
  const quoteOp = ref<QuoteOp>('none')
  const dedupeOn = ref(false)
  const dedupeInsensitive = ref(false)
  const sortOn = ref(false)
  const sortCol = ref(0)
  const sortDir = ref<SortDir>('asc')
  const reverseOn = ref(false)
  const skipBlank = ref(true)
  const hasHeader = ref(true)
  const advancedOpen = ref(false)

  // History (restored from localStorage on mount)
  const history = ref<HistoryEntry[]>([])

  // UX feedback refs (anim/notice/pulse/toast)
  const outputFlash = ref(false)
  const dedupeNotice = ref<{ removed: number } | null>(null)
  const dedupePulse = ref(false)
  const autoDetectResult = ref<{ label: string; char: string } | null>(null)

  // Auto-detect-on-paste UX — defaults ON. When the user manually
  // changes the input delimiter (or types a custom one), the
  // `manualOverride` flag flips so subsequent auto-detection from
  // typing doesn't override the user's explicit choice.
  const autoDetectOnPaste = ref(true)
  const manualOverride = ref(false)

  // Status indicator (header) + toast notification (bottom-center).
  // `status` drives the Ready → Processing → Completed readout; `toast`
  // surfaces short-lived confirmations ("Converted successfully",
  // "Copied to clipboard", utility feedback, …).
  const status = ref<'ready' | 'processing' | 'completed' | 'copied'>('ready')
  const toast = ref<string | null>(null)

  // Closure-private timer slots + dedupe-tracking flags so per-
  // component state is fully isolated across mounts (tests rely on
  // this — each `mount()` resets the graph).
  let detectTimer: ReturnType<typeof setTimeout> | null = null
  let detectDebounce: ReturnType<typeof setTimeout> | null = null
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let flashTimer: ReturnType<typeof setTimeout> | null = null
  let downloadTimer: ReturnType<typeof setTimeout> | null = null
  let dedupeNoticeTimer: ReturnType<typeof setTimeout> | null = null
  let pulseTimer: ReturnType<typeof setTimeout> | null = null
  let statusTimer: ReturnType<typeof setTimeout> | null = null
  let toastTimer: ReturnType<typeof setTimeout> | null = null
  let skipAutoSave = false
  let applyingAutoDetect = false
  let prevRowCount = -1
  let prevDedupeOn = false

  // ─── Helpers (pure) ──────────────────────────────
  function resolveDelim(p: DelimPreset, custom: string): string {
    if (p === 'custom') return custom
    return DELIM_MAP[p] ?? ','
  }

  /** Auto-detect delimiter by sampling the first up-to-5 non-blank
   *  lines and scoring field-count consistency across candidates. */
  function detectDelim(raw: string): DelimPreset {
    const candidates: DelimPreset[] = ['comma', 'tab', 'semicolon', 'pipe']
    const lines = raw.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) return 'comma'
    let best: { delim: DelimPreset; score: number } = { delim: 'comma', score: 0 }
    for (const key of candidates) {
      const d = DELIM_MAP[key]!
      const fc = splitLine(lines[0]!, d).length
      if (fc < 2) continue
      let consistent = 0
      for (let i = 1; i < Math.min(lines.length, 5); i++) {
        if (splitLine(lines[i]!, d).length === fc) consistent++
      }
      const score = fc * 10 + consistent * 5
      if (score > best.score) best = { delim: key, score }
    }
    return best.delim
  }

  /** Quote-aware single-line split — respects `"` so a quoted
   *  field may contain the delimiter without being split. */
  function splitLine(line: string, delim: string): string[] {
    const fields: string[] = []
    let cur = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && delim !== '"') {
        quoted = !quoted
      } else if (ch === delim && !quoted) {
        fields.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur)
    return fields
  }

  /** Join mode entry — joins non-blank lines into one row of one
   *  cell containing the joined string. */
  function doJoin(raw: string, delim: string): string[][] {
    const lines = raw.split('\n').filter((l) => l.trim() !== '')
    const joined = lines.join(delim)
    return [[joined]]
  }

  /** Parse the raw input according to the current mode + delimiter. */
  function parseRaw() {
    const raw = input.value.trim()
    if (!raw) return { rows: [] as string[][], delim: ',' }

    if (mode.value === 'join') {
      const delim = resolveDelim(outDelim.value, customOutDelim.value)
      if (!delim) return { rows: [] as string[][], delim: ',' }
      return { rows: doJoin(raw, delim), delim }
    }

    const delim = resolveDelim(inDelim.value, customInDelim.value)
    if (!delim) return { rows: [] as string[][], delim: ',' }

    const lines = raw.split('\n').filter((l) => l.trim() !== '')
    const rows = lines.map((l) => splitLine(l, delim))
    return { rows, delim }
  }

  // ─── Transform pipeline (computed) ───────────────
  const transformed = computed(() => {
    const { rows } = parseRaw()
    if (rows.length === 0) return [] as string[][]

    let out = rows.map((r) => [...r])

    // 1. Skip blank rows
    if (skipBlank.value) {
      out = out.filter((r) => r.some((c) => c.trim() !== ''))
    }
    if (out.length === 0) return []

    // 2. Trim
    if (trimOn.value) {
      out = out.map((r) => r.map((c) => c.trim()))
    }

    // 3. Quotes (add or strip surrounding `"`/`'`)
    if (quoteOp.value === 'add') {
      out = out.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`))
    } else if (quoteOp.value === 'remove') {
      out = out.map((r) =>
        r.map((c) => {
          if ((c.startsWith('"') && c.endsWith('"')) || (c.startsWith("'") && c.endsWith("'"))) {
            return c.slice(1, -1)
          }
          return c
        }),
      )
    }

    // 4. Dedupe (case-insensitive opt-in lowercases before keying)
    if (dedupeOn.value) {
      const seen = new Set<string>()
      const norm = dedupeInsensitive.value
        ? (c: string) => c.toLowerCase()
        : (c: string) => c
      out = out.filter((r) => {
        const key = r.map(norm).join('\x00')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    // 5. Sort (numeric > alphabetical; respects hasHeader)
    if (sortOn.value && mode.value === 'split') {
      const col = Math.min(Math.max(sortCol.value, 0), (out[0]?.length ?? 1) - 1)
      const dir = sortDir.value === 'asc' ? 1 : -1
      const head = hasHeader.value ? out[0]! : null
      const body = hasHeader.value ? out.slice(1) : out
      body.sort((a, b) => {
        const va = (a[col] ?? '').toLowerCase()
        const vb = (b[col] ?? '').toLowerCase()
        const na = Number(va)
        const nb = Number(vb)
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir
        return va.localeCompare(vb) * dir
      })
      out = head ? [head!, ...body] : body
    }

    // 6. Reverse (respects hasHeader)
    if (reverseOn.value) {
      if (hasHeader.value && out.length > 1) {
        out = [out[0]!, ...out.slice(1).reverse()]
      } else {
        out = [...out].reverse()
      }
    }

    return out
  })

  // ─── Output (computed) ───────────────────────────
  const outDelimChar = computed(() => resolveDelim(outDelim.value, customOutDelim.value))

  const output = computed(() => {
    const rows = transformed.value
    if (rows.length === 0) return ''

    switch (outFormat.value) {
      case 'json-array':
        return JSON.stringify(rows, null, 2)
      case 'json-objects': {
        if (rows.length < 2) return JSON.stringify(rows, null, 2)
        const [h, ...d] = rows as [string[], ...string[][]]
        return JSON.stringify(
          d.map((r) => {
            const o: Record<string, string> = {}
            h.forEach((k, i) => { o[k] = r[i] ?? '' })
            return o
          }),
          null,
          2,
        )
      }
      case 'delimited':
        return rows.map((r) => r.join(outDelimChar.value)).join('\n')
      case 'table':
      default:
        return rows
          .map((r) =>
            r.map((c) => (c.includes(' ') || c.includes('|') ? `"${c}"` : c)).join(' | '),
          )
          .join('\n')
    }
  })

  // ─── Stats (computed) ─────────────────────────────
  const inputLineCount = computed(() => input.value.trim().split('\n').filter((l) => l.trim() !== '').length)
  const rowCount = computed(() => transformed.value.length)
  const colCount = computed(() => transformed.value[0]?.length ?? 0)

  const inputBytes = computed(() => new Blob([input.value]).size)
  const outputBytes = computed(() => new Blob([output.value]).size)
  const formatLabel = computed(() => FORMAT_LABELS[outFormat.value])

  // Count of toggled-off-default transform options for the
  // Advanced panel badge.
  const activeTransformCount = computed(() => [
    !trimOn.value,
    quoteOp.value !== 'none',
    dedupeOn.value,
    dedupeInsensitive.value,
    sortOn.value,
    reverseOn.value,
    !hasHeader.value,
    !skipBlank.value,
  ].filter(Boolean).length)

  // ─── Actions ─────────────────────────────────────
  function autoDetect() {
    const raw = input.value.trim()
    if (!raw) return
    const detected = detectDelim(raw)
    // Mark this delimiter update as internal so the manual-override
    // watcher does not disable future auto-detection after the first
    // successful detection.
    applyingAutoDetect = detected !== inDelim.value
    inDelim.value = detected
    const opt = DELIM_OPTIONS.find((o) => o.key === detected)
    if (opt) {
      autoDetectResult.value = { label: opt.label, char: opt.char }
      if (detectTimer) clearTimeout(detectTimer)
      detectTimer = setTimeout(() => { autoDetectResult.value = null }, 2500)
    }
  }

  async function doCopy() {
    if (!output.value) return
    try {
      await navigator.clipboard.writeText(output.value)
      copied.value = true
      status.value = 'copied'
      showToast('Copied to clipboard')
      const snapshot = input.value
      setTimeout(() => {
        copied.value = false
        // Don't re-assert 'completed' if the user changed the input
        // during the 2s window — the receipt would otherwise return
        // for data they've already edited (stale confirmation).
        status.value = input.value === snapshot && input.value.trim()
          ? 'completed'
          : 'ready'
      }, 2000)
    } catch { /* noop */ }
  }

  function doDownload() {
    if (!output.value) return
    const ext = outFormat.value === 'json-array' || outFormat.value === 'json-objects'
      ? 'json'
      : outFormat.value === 'delimited' ? 'csv' : 'txt'
    const mime = ext === 'json' ? 'application/json' : 'text/plain;charset=utf-8'
    try {
      const blob = new Blob([output.value], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `delimiter-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      downloaded.value = true
      showToast('Downloaded')
      if (downloadTimer) clearTimeout(downloadTimer)
      downloadTimer = setTimeout(() => { downloaded.value = false }, 2000)
    } catch { /* noop */ }
  }

  function clearInput() {
    input.value = ''
    copied.value = false
  }

  function resetTransforms() {
    trimOn.value = true
    quoteOp.value = 'none'
    dedupeOn.value = false
    dedupeInsensitive.value = false
    sortOn.value = false
    sortCol.value = 0
    sortDir.value = 'asc'
    reverseOn.value = false
    skipBlank.value = true
    hasHeader.value = true
  }

  function loadSample() {
    mode.value = 'split'
    inDelim.value = 'comma'
    outFormat.value = 'table'
    input.value = [
      'Name , Role, Language , Experience',
      'Alice Chen,Frontend Lead,TypeScript,7 years',
      '  Bima Santoso ,DevOps,SRE,5 years',
      'Clara Müller,Backend,Rust,4 years',
      'David Park,Full Stack,Go,9 years',
      '"Eka Putri"  ,Data Engineer,Python,6 years',
      'David Park,Full Stack,Go,9 years',
    ].join('\n')
  }

  function loadJoinSample() {
    mode.value = 'join'
    outDelim.value = 'comma'
    outFormat.value = 'delimited'
    input.value = [
      'Alice Chen',
      'Bima Santoso',
      'Clara Müller',
      'David Park',
      'Eka Putri',
    ].join('\n')
  }

  function cycleSortDir() { sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc' }

  // ─── Convert + status + toast ───────────────────────
  /** Primary CTA — the workspace converts live as you type, so this
   *  exists to drive the Ready → Processing → Completed status readout
   *  and confirm with a toast + output flash. */
  function convert() {
    if (!input.value.trim()) return
    status.value = 'processing'
    const snapshot = input.value
    if (statusTimer) clearTimeout(statusTimer)
    statusTimer = setTimeout(() => {
      // If the user edited the input since Convert was pressed, don't
      // claim a successful conversion of data they've moved on from.
      if (input.value !== snapshot) { status.value = 'ready'; return }
      status.value = 'completed'
      outputFlash.value = true
      if (flashTimer) clearTimeout(flashTimer)
      flashTimer = setTimeout(() => { outputFlash.value = false }, 600)
      // The on-page summary receipt (gated on status) is the primary
      // confirmation now; skip the redundant bottom toast so screen
      // readers aren't announced twice for the same action.
    }, 300)
  }

  function showToast(message: string) {
    toast.value = message
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = null }, 2500)
  }

  // ─── Text utilities (one-shot, operate on raw input) ─
  function applyUtility(kind: 'reverse' | 'shuffle' | 'number' | 'upper' | 'lower' | 'count') {
    if (!input.value.trim()) return
    const lines = input.value.split('\n')
    switch (kind) {
      case 'reverse':
        input.value = lines.reverse().join('\n')
        break
      case 'shuffle': {
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[lines[i], lines[j]] = [lines[j]!, lines[i]!]
        }
        input.value = lines.join('\n')
        break
      }
      case 'number':
        input.value = lines.map((l, i) => `${i + 1}. ${l}`).join('\n')
        break
      case 'upper':
        input.value = input.value.toUpperCase()
        break
      case 'lower':
        input.value = input.value.toLowerCase()
        break
      case 'count': {
        const nonEmpty = lines.filter((l) => l.trim() !== '').length
        const words = input.value.trim() ? input.value.trim().split(/\s+/).length : 0
        showToast(`${nonEmpty} line${nonEmpty !== 1 ? 's' : ''} · ${words} word${words !== 1 ? 's' : ''} · ${input.value.length} chars`)
        return
      }
    }
    showToast(`Applied: ${kind}`)
  }

  // ─── Format presets (sidebar From → To pickers) ─────
  // From maps format language onto the delimiter presets the parser
  // already understands; To maps onto outFormat (+ outDelim for the
  // delimited outputs) so CSV → JSON / CSV → TSV flows reuse the exact
  // same output pipeline.
  const fromPreset = computed<'csv' | 'tsv' | 'semicolon' | 'pipe' | 'custom'>(() => {
    if (inDelim.value === 'comma') return 'csv'
    if (inDelim.value === 'tab') return 'tsv'
    return inDelim.value
  })

  const toPreset = computed<'table' | 'json' | 'csv' | 'tsv'>(() => {
    if (outFormat.value === 'table') return 'table'
    if (outFormat.value === 'json-array' || outFormat.value === 'json-objects') return 'json'
    return outDelim.value === 'tab' ? 'tsv' : 'csv'
  })

  function setFromFormat(fmt: 'csv' | 'tsv' | 'semicolon' | 'pipe' | 'custom') {
    inDelim.value = fmt === 'csv' ? 'comma' : fmt === 'tsv' ? 'tab' : fmt
  }

  function setToFormat(fmt: 'table' | 'json' | 'csv' | 'tsv') {
    if (fmt === 'table') { outFormat.value = 'table'; return }
    if (fmt === 'json') { outFormat.value = 'json-objects'; return }
    outFormat.value = 'delimited'
    outDelim.value = fmt === 'csv' ? 'comma' : 'tab'
  }

  // ─── Quick examples (one-click chips on top of the workspace) ───────────────
  // Each preset also flips `inDelim` + `outFormat` to the right combo for
  // the picked data so the user lands on a working preview, not a raw blob.
  const QUICK_EXAMPLES = {
    csv: {
      label: 'CSV',
      inDelim: 'comma' as DelimPreset,
      outFormat: 'table' as OutFormat,
      input: [
        'Name , Role, Language , Experience',
        'Alice Chen,Frontend Lead,TypeScript,7 years',
        '  Bima Santoso ,DevOps,SRE,5 years',
        'Clara Müller,Backend,Rust,4 years',
        'David Park,Full Stack,Go,9 years',
        'David Park,Full Stack,Go,9 years',
      ].join('\n'),
    },
    tsv: {
      label: 'TSV',
      inDelim: 'tab' as DelimPreset,
      outFormat: 'table' as OutFormat,
      input: [
        'Name\tRole\tLanguage',
        'Alice Chen\tFrontend Lead\tTypeScript',
        'Bima Santoso\tDevOps\tSRE',
        'Clara Müller\tBackend\tRust',
      ].join('\n'),
    },
    json: {
      label: 'JSON',
      inDelim: 'comma' as DelimPreset,
      outFormat: 'json-objects' as OutFormat,
      input: [
        'name,email,age',
        'Alice Chen,alice@example.com,32',
        'Bima Santoso,bima@example.com,28',
        'Clara Müller,clara@example.com,41',
      ].join('\n'),
    },
    pipe: {
      label: 'Pipe',
      inDelim: 'pipe' as DelimPreset,
      outFormat: 'table' as OutFormat,
      input: [
        'service|status|uptime',
        'api-primary|ok|14d',
        'api-replica|ok|14d',
        'cron-worker|degraded|2h',
      ].join('\n'),
    },
  } as const

  async function loadExample(key: keyof typeof QUICK_EXAMPLES) {
    const ex = QUICK_EXAMPLES[key]
    if (!ex) return
    inDelim.value = ex.inDelim
    outFormat.value = ex.outFormat
    input.value = ex.input
    // Reset the manual-override latch AFTER this flush cycle: mutating
    // `inDelim` above fires `watch([inDelim, customInDelim])`, which
    // re-latches `manualOverride` in the pre-flush. Deferring the reset
    // to nextTick lets auto-detect-on-type resume on the loaded data.
    await nextTick()
    manualOverride.value = false
  }

  // ─── History (localStorage-backed) ────────────────
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) history.value = JSON.parse(raw) as HistoryEntry[]
    } catch { history.value = [] }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, MAX_HISTORY)))
    } catch { /* quota exceeded */ }
  }

  function pushHistory() {
    if (!input.value.trim()) return
    const prev = history.value[0]
    if (prev && prev.input === input.value && prev.mode === mode.value
      && prev.inDelim === inDelim.value && prev.outFormat === outFormat.value) return
    history.value = [
      {
        input: input.value,
        mode: mode.value,
        inDelim: inDelim.value,
        customInDelim: customInDelim.value,
        outDelim: outDelim.value,
        outFormat: outFormat.value,
        ts: Date.now(),
      },
      ...history.value,
    ].slice(0, MAX_HISTORY)
    saveHistory()
  }

  function restoreEntry(entry: HistoryEntry) {
    skipAutoSave = true
    input.value = entry.input
    mode.value = entry.mode
    inDelim.value = entry.inDelim
    customInDelim.value = entry.customInDelim
    outDelim.value = entry.outDelim
    outFormat.value = entry.outFormat
  }

  function clearHistory() {
    history.value = []
    localStorage.removeItem(HISTORY_KEY)
  }

  function formatTime(ts: number): string {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return d.toLocaleDateString()
  }

  function summary(entry: HistoryEntry): string {
    const lines = entry.input.trim().split('\n').length
    return `${lines} line${lines !== 1 ? 's' : ''} · ${entry.mode}`
  }

  // ─── UX feedback helpers ──────────────────────────
  function pulseDedupe() {
    dedupePulse.value = true
    if (pulseTimer) clearTimeout(pulseTimer)
    pulseTimer = setTimeout(() => { dedupePulse.value = false }, 700)
  }

  function showDedupeNotice(removed: number) {
    if (removed <= 0) return
    dedupeNotice.value = { removed }
    if (dedupeNoticeTimer) clearTimeout(dedupeNoticeTimer)
    dedupeNoticeTimer = setTimeout(() => { dedupeNotice.value = null }, 2800)
  }

  // ─── Keyboard shortcut handler ───────────────────
  function onKeydown(e: KeyboardEvent) {
    // ⌘/Ctrl + Enter → Convert (status pulse + toast)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      convert()
      return
    }
    // ⌘/Ctrl + Shift + C → Copy result (plain ⌘C stays native copy)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault()
      doCopy()
      return
    }
  }

  // ─── Watchers ─────────────────────────────────────
  // Clamp sortCol when column count drops
  watch(colCount, (n) => {
    if (sortCol.value >= n) sortCol.value = Math.max(0, n - 1)
  })

  // Auto-save to history 2 s after typing settles AND auto-detect
  // the delimiter 800 ms after typing settles (skipAutoSave toggled
  // by restoreEntry() to avoid double-pushing the just-restored
  // entry). Auto-detect is suppressed when the toggle is OFF, the
  // user already manually picked a delim, or the input is too
  // short to count as canonical data (< 10 chars).
  watch(input, () => {
    if (skipAutoSave) { skipAutoSave = false; return }
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(pushHistory, 2000)
    if (!autoDetectOnPaste.value || manualOverride.value) return
    const raw = input.value.trim()
    if (raw.length < 10) return
    if (detectDebounce) clearTimeout(detectDebounce)
    detectDebounce = setTimeout(() => {
      if (!autoDetectOnPaste.value || manualOverride.value) return
      autoDetect()
    }, 800)
  })

  // Manual-override latch — fires when the user explicitly picks a
  // delim (or types a custom one), so auto-detect-on-paste doesn't
  // fight the user's choice.
  watch([inDelim, customInDelim], ([newDelim, newCustom], [oldDelim, oldCustom]) => {
    if (oldDelim === undefined) return // initial run
    if (newDelim !== oldDelim || newCustom !== oldCustom) {
      if (applyingAutoDetect) {
        applyingAutoDetect = false
      } else {
        manualOverride.value = true
      }
    }
  })

  // Status drops back to 'ready' whenever the input changes, so the
  // conversion-summary receipt (gated on status) doesn't show stale
  // rows/cols/bytes for freshly-edited data after a Convert.
  watch(input, () => {
    status.value = 'ready'
  })

  // Output-change flash (600 ms) — surfaces that the conversion
  // actually responded to the most recent keystroke / toggle.
  watch(output, (val, old) => {
    if (val === old) return
    outputFlash.value = true
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { outputFlash.value = false }, 600)
  })

  // Dedupe-aware UX feedback: when the user toggles dedupe ON,
  // surface how many rows were removed and pulse the toggle pill.
  // Tracks the previous rowCount across toggles so `removed =
  // prevRowCount - rowCount` is exact (not an estimate).
  watch([dedupeOn, rowCount], ([dedupe, count]) => {
    if (dedupe && !prevDedupeOn && prevRowCount >= 0) {
      const removed = Math.max(0, prevRowCount - count)
      showDedupeNotice(removed)
      if (removed > 0) pulseDedupe()
    }
    prevDedupeOn = dedupe
    prevRowCount = count
  })

  // ─── Lifecycle ───────────────────────────────────
  onMounted(async () => {
    loadHistory()
    // Seed the baseline row count AFTER first computed run so the
    // dedupe-on transition has an accurate previous count to diff.
    await nextTick()
    prevRowCount = rowCount.value
  })

  onBeforeUnmount(() => {
    if (saveTimer) clearTimeout(saveTimer)
    if (flashTimer) clearTimeout(flashTimer)
    if (detectTimer) clearTimeout(detectTimer)
    if (detectDebounce) clearTimeout(detectDebounce)
    if (dedupeNoticeTimer) clearTimeout(dedupeNoticeTimer)
    if (downloadTimer) clearTimeout(downloadTimer)
    if (pulseTimer) clearTimeout(pulseTimer)
    if (statusTimer) clearTimeout(statusTimer)
    if (toastTimer) clearTimeout(toastTimer)
  })

  // ─── Public API ──────────────────────────────────
  return {
    // State refs (test-class names live in the consuming template;
    // these refs are what binds them)
    input, mode, inDelim, customInDelim, outDelim, customOutDelim, outFormat,
    copied, downloaded,
    trimOn, quoteOp, dedupeOn, dedupeInsensitive, sortOn, sortCol, sortDir,
    reverseOn, skipBlank, hasHeader, advancedOpen,
    history,
    outputFlash, dedupeNotice, dedupePulse, autoDetectResult,
    autoDetectOnPaste, manualOverride,
    status, toast,

    // Computeds
    transformed, output, rowCount, colCount,
    inputLineCount, inputBytes, outputBytes, formatLabel,
    activeTransformCount, outDelimChar,
    fromPreset, toPreset,

    // Constants (consumed by templates as v-for values)
    DELIM_OPTIONS,
    MAX_HISTORY,
    QUICK_EXAMPLES,

    // Actions / handlers
    autoDetect, doCopy, doDownload, clearInput, resetTransforms,
    loadSample, loadJoinSample, cycleSortDir,
    loadExample,
    restoreEntry, clearHistory, formatTime, summary,
    pulseDedupe, showDedupeNotice,
    convert, showToast, applyUtility, setFromFormat, setToFormat,
    onKeydown,
  }
}
