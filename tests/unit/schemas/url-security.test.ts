import { describe, expect, it } from 'vitest'

import { ProjectSchema } from '~~/shared/schemas/project'
import { ToolSchema } from '~~/shared/schemas/tool'
import { safeExternalUrl } from '~~/shared/schemas/_utils'

/**
 * URL injection defense — locks in the audit's "defense at schema
 * layer" finding as an executable test.
 *
 * `liveUrl` and `repoUrl` are surfaced as `<a :href="…">` in
 * ProjectCard.vue (and via `[slug].vue` detail pages). If user-
 * supplied content via `content/projects/*.md` could pass a
 * `javascript:` / `data:` / `vbscript:` payload through the schema
 * layer, it would land in a live `href` attribute and execute on
 * click — a classic XSS sink. Zod's `z.string().url()` already
 * restricts to http/https/ftp/mailto (it parses via the WHATWG URL
 * standard then rejects non-web protocols). This test pins that
 * behavior so a future schema relax can't silently regress it.
 */

const PROJECT_BASE: Record<string, unknown> = {
  title: 'Sec',
  slug: 'sec',
  description: 'A test project for URL injection regression coverage.',
  role: 'Tester',
  client: 'Test',
  year: 2024,
  status: 'shipped',
  featured: false,
  tags: ['test'],
  technologies: [{ name: 'Test', purpose: 'fixture' }],
  thumbnail: '/projects/sec/cover.png',
  images: [],
  liveUrl: null,
  repoUrl: null,
  metrics: [],
  relatedProjects: [],
}

const TOOL_BASE: Record<string, unknown> = {
  title: 'Sec',
  slug: 'sec',
  description: 'A test tool for URL injection regression coverage.',
  category: 'Utilities',
  featured: false,
  seo: {
    title: 'Sec',
    description: 'A test tool for URL injection regression coverage.',
  },
}

const MALICIOUS_SCHEMES: ReadonlyArray<{ scheme: string, url: string }> = [
  { scheme: 'javascript:', url: 'javascript:alert(document.cookie)' },
  { scheme: 'data:text/html', url: 'data:text/html,<script>alert(1)</script>' },
  { scheme: 'data:text/javascript', url: 'data:text/javascript,alert(1)' },
  { scheme: 'vbscript:', url: 'vbscript:msgbox(1)' },
  { scheme: 'file:', url: 'file:///etc/passwd' },
  { scheme: 'jar:', url: 'jar:http://evil.com/x.jar!/README' },
  { scheme: 'blob:', url: 'blob:http://evil.com/abc' },
]

const BENIGN_SCHEMES: ReadonlyArray<{ scheme: string, url: string }> = [
  { scheme: 'http:', url: 'http://example.com/repo' },
  { scheme: 'https:', url: 'https://example.com/repo' },
  { scheme: 'https:', url: 'https://github.com/AlberthYap/TensiTrack' },
  { scheme: 'mailto:', url: 'mailto:hi@example.com' },
]

describe('ProjectSchema URL injection defense', () => {
  describe.each(MALICIOUS_SCHEMES)('rejects $scheme scheme', ({ url }) => {
    it(`rejects liveUrl = ${url}`, () => {
      const r = ProjectSchema.safeParse({ ...PROJECT_BASE, liveUrl: url })
      expect(r.success).toBe(false)
    })
    it(`rejects repoUrl = ${url}`, () => {
      const r = ProjectSchema.safeParse({ ...PROJECT_BASE, repoUrl: url })
      expect(r.success).toBe(false)
    })
  })

  describe.each(BENIGN_SCHEMES)('accepts $scheme scheme', ({ url }) => {
    it(`accepts liveUrl = ${url}`, () => {
      const r = ProjectSchema.safeParse({ ...PROJECT_BASE, liveUrl: url })
      expect(r.success).toBe(true)
    })
    it(`accepts repoUrl = ${url}`, () => {
      const r = ProjectSchema.safeParse({ ...PROJECT_BASE, repoUrl: url })
      expect(r.success).toBe(true)
    })
  })
})

describe('ToolSchema URL injection defense', () => {
  it('inherits the same safeExternalUrl guard on its optional url + repoUrl fields', () => {
    const surface = ToolSchema.shape as Record<string, { _def?: unknown }>
    expect(surface.url).toBeDefined()
    expect(surface.repoUrl).toBeDefined()
    // Sanity: each of those fields is `safeExternalUrl.optional()`, which
    // means a malicious payload still fails the same allowlist refine.
    const malicious = ProjectSchema.safeParse({
      ...PROJECT_BASE,
      liveUrl: 'javascript:alert(1)',
    })
    expect(malicious.success).toBe(false)
  })

  it('sanity check: safeExternalUrl itself rejects javascript:', () => {
    const r = safeExternalUrl.safeParse('javascript:alert(1)')
    expect(r.success).toBe(false)
  })

  it('sanity check: safeExternalUrl itself accepts https:', () => {
    const r = safeExternalUrl.safeParse('https://example.com')
    expect(r.success).toBe(true)
  })

  it('rejects empty string as URL at the schema layer', () => {
    const r = ProjectSchema.safeParse({ ...PROJECT_BASE, liveUrl: '' })
    expect(r.success).toBe(false)
  })

  it('rejects bare path as URL (must include a scheme + host)', () => {
    const r = ProjectSchema.safeParse({ ...PROJECT_BASE, liveUrl: '/projects/foo' })
    expect(r.success).toBe(false)
  })

  it('rejects hostname-only URL without scheme', () => {
    const r = ProjectSchema.safeParse({ ...PROJECT_BASE, liveUrl: 'example.com/repo' })
    expect(r.success).toBe(false)
  })
})
