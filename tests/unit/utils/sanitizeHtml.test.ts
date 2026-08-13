import { describe, expect, it } from 'vitest'

import { sanitizeMarkdownHtml } from '~~/shared/sanitizeHtml'

describe('sanitizeMarkdownHtml — XSS hardening (audit C3)', () => {
  it('strips <script> tags and inline event handlers', () => {
    const out = sanitizeMarkdownHtml(
      '<p>Hello</p><script>alert(1)</script><p onclick="evil()">x</p>',
    )
    expect(out).not.toContain('<script')
    expect(out).not.toContain('onclick')
    expect(out).toContain('Hello')
  })

  it('strips javascript: URLs from links', () => {
    const out = sanitizeMarkdownHtml(
      '<a href="javascript:alert(1)">click</a><a href="https://ok.dev">ok</a>',
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('alert(')
    expect(out).toContain('href="https://ok.dev"')
  })

  it('keeps safe markdown tags (p, strong, em, ul, li, code, pre)', () => {
    const out = sanitizeMarkdownHtml(
      '<p><strong>bold</strong> and <em>it</em></p><ul><li><code>x</code></li></ul>',
    )
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<em>it</em>')
    expect(out).toContain('<ul><li><code>x</code></li></ul>')
  })

  it('strips unsafe tags like iframe, object, embed, svg, style', () => {
    const out = sanitizeMarkdownHtml(
      '<iframe src="https://evil"></iframe><style>*{display:none}</style><svg onload="x()"></svg><p>safe</p>',
    )
    expect(out).not.toContain('<iframe')
    expect(out).not.toContain('<style')
    expect(out).not.toContain('<svg')
    expect(out).toContain('safe')
  })

  it('does not alter ordinary paragraph text', () => {
    const out = sanitizeMarkdownHtml('<p>Just text.</p>')
    expect(out).toBe('<p>Just text.</p>')
  })
})
