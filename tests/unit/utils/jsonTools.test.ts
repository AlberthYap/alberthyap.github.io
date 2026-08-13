import { describe, expect, it } from 'vitest'

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
} from '~/utils/jsonTools'

describe('jsonTools — sort & strip', () => {
  it('sorts object keys recursively', () => {
    expect(sortObjectKeys({ b: 1, a: { d: 2, c: 3 } })).toEqual({ a: { c: 3, d: 2 }, b: 1 })
  })

  it('strips empty values recursively including inside arrays', () => {
    expect(stripEmptyFields({ a: 1, b: null, c: '', d: [], e: {}, f: [1, null, '', {}, 3], g: { h: null, i: 2 } }))
      .toEqual({ a: 1, f: [1, 3], g: { i: 2 } })
  })
})

describe('jsonTools — flatten / unflatten', () => {
  it('flattens nested objects to dot-path keys', () => {
    expect(flattenObject({ a: { b: 1, c: { d: 2 } }, e: [1, 2] }))
      .toEqual({ 'a.b': 1, 'a.c.d': 2, e: [1, 2] })
  })

  it('unflattens dot-path keys back to nested objects', () => {
    expect(unflattenObject({ 'a.b': 1, 'a.c.d': 2, e: [1, 2] }))
      .toEqual({ a: { b: 1, c: { d: 2 } }, e: [1, 2] })
  })

  it('round-trips flatten → unflatten', () => {
    const input = { x: { y: { z: 1 } }, list: [1, 2], keep: 'v' }
    expect(unflattenObject(flattenObject(input))).toEqual(input)
  })

  it('does not pollute Object.prototype via __proto__ keys (C2)', () => {
    const before = Object.prototype.polluted
    unflattenObject({ '__proto__.polluted': 'yes', 'a.b': 1 })
    expect(({} as Record<string, unknown>).polluted).toBe(before)
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('skips constructor/prototype path segments instead of walking them (C2)', () => {
    const result = unflattenObject({ 'constructor.prototype.x': 1, 'ok.y': 2 })
    expect(result).toEqual({ ok: { y: 2 } })
    expect(({} as Record<string, unknown>).x).toBeUndefined()
  })

  it('keeps safe nested values when blocking segments are present', () => {
    expect(unflattenObject({ 'a.b': 1, 'a.__proto__.x': 2, 'a.c': 3 }))
      .toEqual({ a: { b: 1, c: 3 } })
  })
})

describe('jsonTools — CSV', () => {
  it('converts an array of objects to CSV with header', () => {
    const csv = toCsv([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 },
    ])
    expect(csv).toBe('name,age\nAda,36\nGrace,45')
  })

  it('quotes cells containing commas or quotes', () => {
    const csv = toCsv([{ note: 'a, b', quote: 'say "hi"' }])
    expect(csv).toBe('note,quote\n"a, b","say ""hi"""')
  })

  it('serializes nested object cells as JSON (quotes doubled per CSV)', () => {
    const csv = toCsv([{ meta: { x: 1 } }])
    expect(csv).toBe('meta\n"{""x"":1}"')
  })

  it('throws for non-array input', () => {
    expect(() => toCsv({ a: 1 })).toThrow()
    expect(() => toCsv([])).toThrow()
  })

  it('parses simple CSV to array of objects with coercion', () => {
    expect(parseCsv('name,age,active\nAda,36,true\nGrace,45,false'))
      .toEqual([
        { name: 'Ada', age: 36, active: true },
        { name: 'Grace', age: 45, active: false },
      ])
  })

  it('parses quoted fields with commas and escaped quotes', () => {
    expect(parseCsv('note,quote\n"a, b","say ""hi"""'))
      .toEqual([{ note: 'a, b', quote: 'say "hi"' }])
  })

  it('handles CRLF and trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([{ a: 1, b: 2 }])
  })

  it('round-trips toCsv → parseCsv', () => {
    const data = [
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 },
    ]
    expect(parseCsv(toCsv(data))).toEqual(data)
  })

  it('rejects an unterminated quoted field (H6)', () => {
    expect(() => parseCsv('a,b\n1,"unclosed')).toThrow(/Unterminated quoted/)
  })

  it('rejects duplicate headers instead of silently overwriting (H6)', () => {
    expect(() => parseCsv('a,a\n1,2')).toThrow(/Duplicate CSV header/)
  })

  it('rejects blank headers (H6)', () => {
    expect(() => parseCsv('a,\n1,2')).toThrow(/Blank header/)
  })

  it('preserves raw strings when coerce is disabled (H6)', () => {
    const parsed = parseCsv('code,flag,note\n00123,true,plain')
    expect(parsed).toEqual([{ code: 123, flag: true, note: 'plain' }])
    const raw = parseCsv('code,flag\n00123,true', { coerce: false })
    expect(raw).toEqual([{ code: '00123', flag: 'true' }])
  })
})

describe('jsonTools — jq-lite path queries', () => {
  const data = {
    users: [
      { name: 'Ada', skills: ['math', 'code'] },
      { name: 'Grace', skills: ['code', 'navy'] },
    ],
    meta: { count: 2 },
  }

  it('resolves $.users[*].name to a mapped array', () => {
    expect(queryPath(data, '$.users[*].name')).toEqual({ ok: true, value: ['Ada', 'Grace'] })
  })

  it('resolves .users[0].skills[*]', () => {
    expect(queryPath(data, '.users[0].skills[*]')).toEqual({ ok: true, value: ['math', 'code'] })
  })

  it('resolves bracket string keys with special characters', () => {
    expect(queryPath({ 'weird key': { inner: 5 } }, '$["weird key"].inner')).toEqual({ ok: true, value: 5 })
  })

  it('empty expression returns the root', () => {
    expect(queryPath(data, '')).toEqual({ ok: true, value: data })
  })

  it('returns error for [*] on a non-array', () => {
    expect(queryPath(data, '.meta[*]')).toEqual({ ok: false, error: expect.any(String) })
  })

  it('returns error for invalid bracket key', () => {
    expect(queryPath(data, '.meta[bad]')).toEqual({ ok: false, error: expect.any(String) })
  })

  it('returns an error when the path continues past a missing index', () => {
    expect(queryPath(data, '.users[9].name')).toEqual({ ok: false, error: expect.any(String) })
  })
})

describe('jsonTools — diff', () => {
  it('marks added, removed and unchanged lines', () => {
    const result = diffLines(['a', 'b', 'c'], ['a', 'x', 'c'])
    expect(result).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'add', text: 'x' },
      { type: 'same', text: 'c' },
    ])
  })

  it('handles appended and removed tails', () => {
    expect(diffLines(['1'], ['1', '2']).filter((l) => l.type !== 'same'))
      .toEqual([{ type: 'add', text: '2' }])
    expect(diffLines(['1', '2'], ['1']).filter((l) => l.type !== 'same'))
      .toEqual([{ type: 'del', text: '2' }])
  })
})

describe('jsonTools — stats', () => {
  it('counts keys, nodes and max depth', () => {
    // root + a + b-array + 3 elements + c + d + true = 8 nodes
    const stats = analyzeJson({ a: 1, b: [1, 2, 3], c: { d: true } })
    expect(stats).toEqual({ keys: 4, nodes: 8, depth: 3 })
  })
})
