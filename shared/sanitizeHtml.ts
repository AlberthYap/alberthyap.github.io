/**
 * Build-time HTML sanitizer for pre-rendered Markdown.
 *
 * `modules/home-snapshot.ts` renders `content/about.md` to HTML with
 * `marked` and injects it into the home page via `v-html`. `marked` is
 * CommonMark-only and does NOT sanitize raw HTML — a malicious or
 * careless future contributor could inject `<script>`, event-handler
 * attributes, or `javascript:` URLs (audit C3).
 *
 * This module applies a strict allowlist at build time so the string
 * that reaches the browser can never carry executable content. It runs
 * only in the Node build pipeline; `sanitize-html` is a devDependency
 * and never ships to the client bundle.
 */
import sanitizeHtml from 'sanitize-html'

const MARKDOWN_ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'del', 'code', 'pre',
  'ul', 'ol', 'li', 'blockquote',
  'a',
]

export function sanitizeMarkdownHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: MARKDOWN_ALLOWED_TAGS,
    allowedAttributes: {
      // Only href on links, and only safe schemes (http/https/mailto/#).
      a: ['href'],
    },
    allowedSchemes: ['http', 'https', 'mailto', '#'],
    allowedSchemesByTag: {},
    allowProtocolRelative: false,
    // Strip anything not allow-listed (script, style, iframe, svg, …).
    disallowedTagsMode: 'discard',
  })
}
