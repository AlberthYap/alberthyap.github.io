# Self-Hosted Variable Fonts

Three woff2 files live here, sourced from the [`@fontsource-variable`](https://fontsource.org/) packages via the jsdelivr CDN and renamed to the canonical filenames the `@font-face` blocks in `app/assets/css/main.css` expect.

## Files committed

```
app/assets/fonts/
├── Literata-Variable.woff2      (wght 100–900, serif headlines)
├── NunitoSans-Variable.woff2    (wght 100–900, body sans)
└── GeistMono-Variable.woff2     (wght 100–900, code mono)
```

Each file is a single OpenType-VF (`wght` axis only) — one fetch serves every text weight a component could ask for, instead of one file per weight. Previously the codebase shipped eight static `*.woff2` files (Literata 400/600/700 + Nunito Sans 400/600/700 + Geist Mono 400/500). The migration dropped that to three at the cost of a slightly larger per-family payload — but with all weights inlined into the same byte stream the browser asks for once.

`@font-face` declarations in `app/assets/css/main.css` reference these exact filenames with `font-weight: 100 900` (axis range syntax) and `format("woff2-variations"), format("woff2")` (Forward-compat mime + legacy fallback). `nuxt generate` ships them through Vite's asset pipeline into `.output/public/_nuxt/` (hashed) — no external CDN, no `NODE_OPTIONS`, no inline data-URIs.

## Typographic stratification

The codebase follows a three-tier typography pairing per DESIGN §4:

| Tier       | Family        | Variable file used                                          | Used for                                              |
| ---------- | ------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Headlines  | Literata      | Literata-Variable.woff2                                     | Serif headlines (h1–h4). Editorial authority.         |
| Body       | Nunito Sans   | NunitoSans-Variable.woff2                                   | Body copy, labels, UI text. High legibility sans.     |
| Mono       | Geist Mono    | GeistMono-Variable.woff2                                    | Code, status pills, technical labels, eyebrow text.   |

The `[id="hero"]` h1, the Navbar brand wordmark, and the Footer wordmark all sit on Literata-Variable — landing the file once covers `font-weight: 700` (h1), `font-weight: 600` (brand/semibold), and any future intermediate weight without an extra request.

`Geist Mono` ranges only over 400–500 in practice (the codebase never asks for mono-bold): the variable file still serves us, but the unused 600–900 axis range is rendered weight-mapped to 500 by the browser. We keep the full axis because every weight the upstream font ships is free — cost of carrying it is bytes-per-weight, all of which share a single gzipped transfer.

## Provenance (where these came from)

`@fontsource-variable` publishes variable axes in `<family>-<axis>-<style>.woff2` form. Acquisition:

```bash
cd app/assets/fonts

# Literata \u2014 serif headlines (wght axis, normal style).
curl -fL --silent --show-error \
  -o Literata-Variable.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/literata@5/files/literata-latin-wght-normal.woff2

# Nunito Sans \u2014 body sans (wght axis, normal style).
curl -fL --silent --show-error \
  -o NunitoSans-Variable.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/nunito-sans@5/files/nunito-sans-latin-wght-normal.woff2

# Geist Mono \u2014 code mono (wght axis, normal style).
curl -fL --silent --show-error \
  -o GeistMono-Variable.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/geist-mono@5/files/geist-mono-latin-wght-normal.woff2
```

These URLs are stable: jsdelivr mirrors @fontsource-variable npm releases exactly, so `@5` pin resolves to the same `.woff2` bytes for the lifetime of the package's `5.x` release line. If `@fontsource-variable` publishes an emergency `6.x` (breaking filename structure), update the `@5` pin and re-run the curl block. Random curl probes should still report `HTTP/2 200` with `content-type: font/woff2`.

Acceptance gate for any future refresh: every downloaded file must start with the `wOF2` magic (`head -c 4 file.woff2 | od -An -c | tr -d ' '` \u2192 `wOF2`) and the catalog sizes should stay within the bundle below.

## Delivery model \u00b7 budget \u00b7 trim options

`nuxt generate` ships the three committed woff2 through Vite's asset pipeline into `.output/public/_nuxt/` (content-hashed); no external CDN, no inline data-URIs.

**Aggregate on disk**: ~107 KiB.

| Family          | File                       | Size      |
| --------------- | -------------------------- | --------: |
| Literata        | Literata-Variable.woff2    | ~52 KiB   |
| Nunito Sans     | NunitoSans-Variable.woff2  | ~31 KiB   |
| Geist Mono      | GeistMono-Variable.woff2   | ~23 KiB   |

**Per-route cold-cache first-paint subset** (the byte cost a visitor pays the FIRST time they load the route \u2014 after that the same-origin cache holds the files, and subsequent SSG navigations add **0 KiB**):

| Route                                              | Variable fonts referenced                                   |  \u2248 bytes |
| -------------------------------------------------- | ----------------------------------------------------------- | -----------: |
| `/` (hero + sections + footer pill)                | Literata-Variable + NunitoSans-Variable + GeistMono-Variable |  \u2248 107 KiB |
| `/projects`, `/projects/<slug>`, `/tools`, `/tools/<slug>` | Literata-Variable + NunitoSans-Variable (no mono surfaces carry code outside of the homepage `HeroDashboard`) |   \u2248 83 KiB |
| future case-study routes that drop Geist Mono usage | Literata-Variable + NunitoSans-Variable only                |   \u2248 83 KiB |

**Preload strategy**: `app/app.vue` `<link rel="preload" as="font">`s `Literata-Variable` and `NunitoSans-Variable` for LCP coverage. Two preloads replace the previous four static-weight fetches. `font-display: swap` keeps text visible while the variable font loads; the `@theme` fallback stack (Georgia / Inter / system fonts / JetBrains Mono) covers the brief swap window.

## Adding a weight (axis or italic)

Variable fonts supersede the "request a new weight file" workflow. To add a weight that's actually distinct (e.g. an italic axis):

```bash
cd app/assets/fonts

# Example: pull Literata wght + ital (italic) axis.
curl -fL --silent --show-error \
  -o Literata-Variable-Italic.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/literata@5/files/literata-latin-wght-italic.woff2

# Then add a parallel @font-face block in app/assets/css/main.css
# (font-style: italic, font-weight: 100 900, src pointing to the
# italic-only file). Browsers will pick the right file based on
# `font-style` matched against the cascade.
```

For weight-only tweaks, do **not** add a new file. The static scheme pre-migration required fetching a second `.woff2` whenever a new weight was needed; the variable scheme serves any weight in range from the same byte stream. Tailwind's `font-medium` (500), `font-semibold` (600), `font-bold` (700) all resolve against the SAME `Literata-Variable.woff2` bytes.

## Migrating back to static (rare)

If a runtime observer shows the variable axis interpolation is producing visible drift on a target weight (e.g. weight 550 reads as too "thin" compared to a tone-on-tone design intent), pin that weight via a static fallback and document the override in the `@font-face` block:

```css
/* In rare cases where the variable axis interpolation produces an
   unwanted artefact at a specific weight (e.g. weight 550 looking
   noticeably thinner than a tone-on-tone design reference pins to
   semibold 600), drop in a static weight file with the same axis
   name + weight and prepend it to the src list:
   src: url(".../Literata-600static.woff2") format("woff2"),
        url(".../Literata-Variable.woff2") format("woff2-variations") */
```

`font-display: swap` keeps that fallback chain looking the same to the visitor.

## Acquisition provenance retcon (history)

The README was rewritten when the codebase migrated from static weights to variable fonts (transition around 2026-07). The previous static acquisition block lived under "Provenance" with eight curl commands, one per weight per family. The migration rationale (REQUEST WATERFALL \u00b7 BUDGET impact) is preserved in the new "Delivery model" section but the byte-counts in the table are now variable-axis totals; the per-file curl list is similarly collapsed to one curl per family.
