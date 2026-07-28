import { z } from 'zod'

/**
 * URL validators shared by content schemas (`ProjectSchema`,
 * `ToolSchema`, …). Zod's stock `z.string().url()` only checks "can
 * the WHATWG URL constructor parse this?" — which still accepts
 * `javascript:`, `data:`, `vbscript:`, and several other schemes
 * whose resolved behavior in browser href attributes is "execute as
 * code" or "exfiltrate data". This helper enforces an explicit
 * allowlist of safe schemes.
 */
const SAFE_PROTOCOLS: ReadonlySet<string> = new Set([
  'http:',
  'https:',
  'mailto:',
])

/**
 * Parser the WHATWG URL constructor would itself reject — for
 * instance bare paths (no scheme + host) and most custom schemes.
 * Rejecting early avoids surfacing the `.refine()` error for inputs
 * that aren't even URL-shaped.
 */
const STRICT_URL = z.string().url()

/**
 * `safeExternalUrl` — accepts only `http:`, `https:`, `mailto:`.
 * Rejects (validated, not just stripped): `javascript:`, `data:`,
 * `vbscript:`, `file:`, `blob:`, `jar:`, anything else not on the
 * allowlist, and any string the WHATWG URL constructor can't parse
 * (relative paths, missing scheme, etc.).
 *
 * Use for any URL that lands in a clickable href, an `og:*` meta
 * tag, a redirect target, or any other surface a browser treats as
 * navigation. Do NOT use for display strings or text fields.
 */
export const safeExternalUrl = STRICT_URL.refine(
  (value) => {
    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      return false
    }
    return SAFE_PROTOCOLS.has(parsed.protocol)
  },
  { message: 'URL scheme not in allowlist (http, https, mailto)' },
)
