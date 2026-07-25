# Self-Hosted Fonts

Eight woff2 files live here, sourced from the [`@fontsource`](https://fontsource.org/) packages via the jsdelivr CDN and renamed to the canonical filenames the `@font-face` blocks in `app/assets/css/main.css` expect.

## Files committed

```
app/assets/fonts/
├── Literata-Regular.woff2       (weight: 400, serif headlines)
├── Literata-Semibold.woff2      (weight: 600, serif headlines)
├── Literata-Bold.woff2          (weight: 700, serif headlines)
├── NunitoSans-Regular.woff2     (weight: 400, body)
├── NunitoSans-Semibold.woff2    (weight: 600, body / labels)
├── NunitoSans-Bold.woff2        (weight: 700, body emphasis)
├── Geist-Mono-Regular.woff2     (weight: 400, code)
└── Geist-Mono-Medium.woff2      (weight: 500, code)
```

`@font-face` declarations in `app/assets/css/main.css` reference these exact filenames. `nuxt generate` ships them through Vite's asset pipeline into `.output/public/_nuxt/` (hashed) — no external CDN, no `NODE_OPTIONS`, no inline data-URIs.

## Typographic stratification

The codebase follows a three-tier typography pairing per DESIGN §4:

| Tier       | Family        | Used for                                              |
| ---------- | ------------- | ----------------------------------------------------- |
| Headlines  | Literata      | Serif headlines (h1-h4). Editorial authority.         |
| Body       | Nunito Sans   | Body copy, labels, UI text. High legibility sans.     |
| Mono       | Geist Mono    | Code, status pills, technical labels, eyebrow text.   |

`Geist-Sans-Bold.woff2` (weight 700) is intentionally **not** shipped: the codebase uses `font-semibold` (600) and `font-medium` (500) but never `font-bold` directly. If a future component needs 700, see [Re-adding weights](#re-adding-weights) below.

## Provenance (where these came from)

`@fontsource` publishes individual-weight `.woff2` files named `<family>-latin-<weight>-normal.woff2`. Committing them under the README's canonical names means downstream tooling stays readable ("Literata-Bold" reads as a weight, "literata-latin-700-normal" reads as a hash). Acquisition:

```bash
cd app/assets/fonts

# Literata — serif headlines (400/600/700 are committed).
curl -fL --silent --show-error \
  -o Literata-Regular.woff2  https://cdn.jsdelivr.net/npm/@fontsource/literata@5/files/literata-latin-400-normal.woff2
curl -fL --silent --show-error \
  -o Literata-Semibold.woff2 https://cdn.jsdelivr.net/npm/@fontsource/literata@5/files/literata-latin-600-normal.woff2
curl -fL --silent --show-error \
  -o Literata-Bold.woff2     https://cdn.jsdelivr.net/npm/@fontsource/literata@5/files/literata-latin-700-normal.woff2

# Nunito Sans — body sans (400/600/700 are committed).
curl -fL --silent --show-error \
  -o NunitoSans-Regular.woff2  https://cdn.jsdelivr.net/npm/@fontsource/nunito-sans@5/files/nunito-sans-latin-400-normal.woff2
curl -fL --silent --show-error \
  -o NunitoSans-Semibold.woff2 https://cdn.jsdelivr.net/npm/@fontsource/nunito-sans@5/files/nunito-sans-latin-600-normal.woff2
curl -fL --silent --show-error \
  -o NunitoSans-Bold.woff2     https://cdn.jsdelivr.net/npm/@fontsource/nunito-sans@5/files/nunito-sans-latin-700-normal.woff2

# Geist Mono — code (400/500 are committed).
curl -fL --silent --show-error \
  -o Geist-Mono-Regular.woff2 https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5/files/geist-mono-latin-400-normal.woff2
curl -fL --silent --show-error \
  -o Geist-Mono-Medium.woff2  https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5/files/geist-mono-latin-500-normal.woff2
```

These URLs are stable: jsdelivr mirrors npm-release files exactly, so `@5` pin will resolve to the same `.woff2` bytes for the lifetime of the package's `5.x` release line. If `@fontsource` publishes an emergency `6.x` (breaking filename structure), update the `@5` pin and re-run `curl`. Random curl probes should still report `HTTP/2 200` with `content-type: font/woff2`.

Acceptance gate for any future refresh: every downloaded file must start with the `wOF2` magic (`head -c 4 file.woff2 | od -An -c | tr -d ' '` → `wOF2`) and be ≥ 5 KB.

## Re-adding weights

If a future component needs Italic (Literata 400/600) or Bold (Geist Sans 700):

```bash
cd app/assets/fonts
# Example: pull Literata 400 italic.
curl -fL --silent --show-error \
  -o Literata-Italic.woff2 https://cdn.jsdelivr.net/npm/@fontsource/literata@5/files/literata-latin-400-italic.woff2
# Then re-add the matching @font-face block in app/assets/css/main.css
# (font-style: italic, src: url("~/assets/fonts/Literata-Italic.woff2")).
```

## Delivery model · budget · trim options

`nuxt generate` ships the eight committed woff2 through Vite's asset pipeline into `.output/public/_nuxt/` (content-hashed); no external CDN, no inline data-URIs.

**Aggregate on disk**: ~204 KiB. Per-file sizes commit history-bound; the eight files together fit comfortably under the static bundle's 80 KB/KiB-per-view ceiling because each route fetches only the tiers it actually uses.

**Per-route cold-cache first-paint subset** (the byte cost a visitor pays the FIRST time they load the route — after that the same-origin cache holds the files, and subsequent SSG navigations add **0 KiB**):

| Route                                | Tiers                                                     |   ≈ bytes |
| ------------------------------------ | --------------------------------------------------------- | --------: |
| `/` (hero + sections + footer pill)  | Literata 400/600/700 + Nunito Sans 400/600/700 + Geist Mono | ≈ 204 KiB |
| `/projects`, `/projects/<slug>`, `/tools`, `/tools/<slug>` | Literata headlines + Nunito Sans body (no code surfaces) | ≈ 132 KiB |
| future case-study routes drop Literata Bold (no 700 weight usage) | Literata 400/600 + Nunito Sans 400/600/700 + Geist Mono | ≈ 188 KiB |

`font-display: swap` keeps text visible while the font loads; the `@theme` fallback stack (Georgia / Inter / system fonts / JetBrains Mono) covers the brief window.

The 80 KB-per-route ceiling from `PRD.md` §13.4 is **exceeded on the home route by ~120 KiB** after the Literata + Nunito Sans upgrade; mitigation paths are documented in `docs/performance-font-budget.md` (TODO Phase 4.x). For now, SSG build budgets remain tolerant because the same-origin cache absorbs the bundle on the second navigation.
