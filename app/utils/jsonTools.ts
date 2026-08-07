/**
 * jsonTools.ts — pure helpers for the JSON Formatter tool.
 *
 * No Vue / DOM dependencies so every function is unit-testable in isolation.
 */

// ─── Sort / strip ─────────────────────────────────────────

/** Sort object keys recursively (arrays preserved, order stable). */
export function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
      return acc
    }, {})
  }
  return obj
}

/** True for values that should be dropped when "Drop empty" is on. */
export function isEmptyValue(v: unknown): boolean {
  if (v === null) return true
  if (typeof v === 'string') return v === ''
  if (Array.isArray(v)) return v.length === 0
  if (v !== null && typeof v === 'object') return Object.keys(v as object).length === 0
  return false
}

/** Recursively strip null, '', [], {} values (and empty leftovers in arrays). */
export function stripEmptyFields(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripEmptyFields).filter((v) => !isEmptyValue(v))
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [k, v]) => {
      const cleaned = stripEmptyFields(v)
      if (!isEmptyValue(cleaned)) acc[k] = cleaned
      return acc
    }, {})
  }
  return obj
}

// ─── Flatten / unflatten ──────────────────────────────────

/** Convert nested objects to dot-path keys: { a: { b: 1 } } → { "a.b": 1 }. Arrays stay intact. */
export function flattenObject(obj: unknown, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix] = obj
    return out
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenObject(v, key))
    } else {
      out[key] = v
    }
  }
  return out
}

/** Reverse of flattenObject: { "a.b": 1 } → { a: { b: 1 } }. */
export function unflattenObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const parts = k.split('.')
    let cursor = out
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const existing = cursor[part]
      if (existing === null || typeof existing !== 'object' || Array.isArray(existing)) {
        const node: Record<string, unknown> = {}
        cursor[part] = node
        cursor = node
      } else {
        cursor = existing as Record<string, unknown>
      }
    }
    cursor[parts[parts.length - 1]] = v
  }
  return out
}

// ─── CSV ──────────────────────────────────────────────────

/** Convert a JSON array of objects to CSV. Throws if the input isn't an array of objects. */
export function toCsv(data: unknown): string {
  if (!Array.isArray(data)) throw new Error('Input must be a JSON array')
  const rows = data.filter((r): r is Record<string, unknown> =>
    r !== null && typeof r === 'object' && !Array.isArray(r),
  )
  if (rows.length === 0) throw new Error('Input must be an array of objects (no object rows found)')

  const columns: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key)
    }
  }

  const escapeCell = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const lines = [
    columns.map(escapeCell).join(','),
    ...rows.map((row) => columns.map((c) => escapeCell(row[c])).join(',')),
  ]
  return lines.join('\n')
}

/** Light coercion for CSV cells: numbers, booleans and null; everything else stays a string. */
function coerceCell(s: string): unknown {
  const t = s.trim()
  if (t === '') return null
  if (t === 'true') return true
  if (t === 'false') return false
  if (t === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return s
}

/** Quote-aware CSV parser → array of objects (first row is the header). Throws on empty input. */
export function parseCsv(text: string): unknown {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\r' || c === '\n') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += c
    }
    i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  // Drop trailing empty rows
  while (rows.length > 0 && rows[rows.length - 1].every((f) => f.trim() === '')) rows.pop()
  if (rows.length === 0) throw new Error('No rows found in CSV input')

  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((r) => {
    const obj: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      obj[h] = coerceCell(r[idx] ?? '')
    })
    return obj
  })
}

// ─── jq-lite path queries ─────────────────────────────────

function tokenizePath(expr: string): string[] {
  const tokens: string[] = []
  let i = 0
  const e = expr.trim()
  while (i < e.length) {
    const c = e[i]
    if (c === '.') {
      i++
      continue
    }
    if (c === '[') {
      const end = e.indexOf(']', i)
      if (end === -1) throw new Error(`Unclosed '[' in path expression`)
      tokens.push(e.slice(i, end + 1))
      i = end + 1
    } else {
      let j = i
      while (j < e.length && e[j] !== '.' && e[j] !== '[') j++
      if (j > i) tokens.push(e.slice(i, j))
      i = j
    }
  }
  return tokens
}

function resolvePath(node: unknown, tokens: string[], pos: number): unknown {
  if (pos >= tokens.length) return node
  const tok = tokens[pos]

  if (tok === '[*]') {
    if (!Array.isArray(node)) throw new Error(`'[*]' applied to a non-array`)
    return node.map((el) => resolvePath(el, tokens, pos + 1))
  }

  if (/^\[\d+\]$/.test(tok)) {
    if (!Array.isArray(node)) throw new Error(`Index applied to a non-array`)
    const idx = Number(tok.slice(1, -1))
    // Out-of-range: continue with `undefined` so a trailing .key raises a clear error
    const next = idx >= 0 && idx < node.length ? node[idx] : undefined
    return resolvePath(next, tokens, pos + 1)
  }

  let key = tok
  if (tok.startsWith('[') && tok.endsWith(']')) {
    // Parse the inner content, e.g. ["weird key"] → "weird key"
    try {
      key = JSON.parse(tok.slice(1, -1))
    } catch {
      throw new Error(`Invalid key: ${tok}`)
    }
    if (typeof key !== 'string') throw new Error(`Invalid key: ${tok}`)
  }

  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    throw new Error(`Cannot access '${key}' on ${Array.isArray(node) ? 'an array — use [n] or [*]' : node === null ? 'null' : 'a non-object'}`)
  }
  return resolvePath((node as Record<string, unknown>)[key], tokens, pos + 1)
}

/** Evaluate a jq-style path like $.users[*].name. Supports .key, ["key"], [n], [*]. */
export function queryPath(
  root: unknown,
  expr: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    let e = expr.trim()
    if (e.startsWith('$')) e = e.slice(1)
    const tokens = tokenizePath(e)
    if (tokens.length === 0) return { ok: true, value: root }
    return { ok: true, value: resolvePath(root, tokens, 0) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Diff ─────────────────────────────────────────────────

export interface DiffLine {
  type: 'same' | 'add' | 'del'
  text: string
}

/**
 * Classic LCS line diff. 'del' = in A only, 'add' = in B only, 'same' = unchanged.
 * Note: O(m·n) memory — fine for JSON documents, which are typically a few thousand lines.
 */
export function diffLines(a: string[], b: string[]): DiffLine[] {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] })
      i++
    } else {
      out.push({ type: 'add', text: b[j] })
      j++
    }
  }
  while (i < m) {
    out.push({ type: 'del', text: a[i] })
    i++
  }
  while (j < n) {
    out.push({ type: 'add', text: b[j] })
    j++
  }
  return out
}

// ─── Stats ────────────────────────────────────────────────

export interface JsonStats {
  keys: number
  nodes: number
  depth: number
}

/**
 * Count total keys, total nodes, and max nesting depth of a JSON value.
 * @param stats Optional pre-filled stats object — mutated in place, so always pass a fresh `{}`.
 */
export function analyzeJson(obj: unknown, depth = 1, stats: JsonStats = { keys: 0, nodes: 0, depth: 0 }): JsonStats {
  stats.nodes++
  if (depth > stats.depth) stats.depth = depth
  if (Array.isArray(obj)) {
    for (const v of obj) analyzeJson(v, depth + 1, stats)
  } else if (obj !== null && typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      stats.keys++
      analyzeJson(v, depth + 1, stats)
    }
  }
  return stats
}
