# Self-Hosted Fonts

This directory holds **Geist Sans** and **Geist Mono** `.woff2` files per `DESIGN.md` §4.1 + `architecture.md` §11.3.

## Required Files

```
app/assets/fonts/
├── Geist-Sans-Regular.woff2    (weight: 400)
├── Geist-Sans-Medium.woff2     (weight: 500)
├── Geist-Sans-Semibold.woff2   (weight: 600)
├── Geist-Sans-Bold.woff2       (weight: 700)
├── Geist-Mono-Regular.woff2    (weight: 400)
└── Geist-Mono-Medium.woff2     (weight: 500)
```

`@font-face` declarations in `app/assets/css/main.css` reference these exact filenames.

## Acquisition

### Option A — `curl` from `vercel/geist-font` GitHub mirror

The canonical source lives in the `vercel/geist-font` repo. Replace the filenames in the URL pattern below. URLs can shift between Vercel releases — **if a 404 occurs, browse https://github.com/vercel/geist-font/releases for current paths and adjust accordingly**.

```bash
cd app/assets/fonts

# Geist Sans
curl -L -o Geist-Sans-Regular.woff2  https://raw.githubusercontent.com/vercel/geist-font/main/fonts/Geist/Geist-Regular.woff2
curl -L -o Geist-Sans-Medium.woff2   https://raw.githubusercontent.com/vercel/geist-font/main/fonts/Geist/Geist-Medium.woff2
curl -L -o Geist-Sans-Semibold.woff2 https://raw.githubusercontent.com/vercel/geist-font/main/fonts/Geist/Geist-Semibold.woff2
curl -L -o Geist-Sans-Bold.woff2     https://raw.githubusercontent.com/vercel/geist-font/main/fonts/Geist/Geist-Bold.woff2

# Geist Mono
curl -L -o Geist-Mono-Regular.woff2  https://raw.githubusercontent.com/vercel/geist-font/main/fonts/GeistMono/GeistMono-Regular.woff2
curl -L -o Geist-Mono-Medium.woff2   https://raw.githubusercontent.com/vercel/geist-font/main/fonts/GeistMono/GeistMono-Medium.woff2
```

### Option B — `@fontsource-variable/*` (npm-distributed)

`@fontsource-variable/geist-sans` and `@fontsource-variable/geist-mono` are the official Fontsource packages:

```bash
npm install -D @fontsource-variable/geist-sans @fontsource-variable/geist-mono
# then copy the .woff2 files into this directory
cp node_modules/@fontsource-variable/geist-sans/files/*.woff2  app/assets/fonts/
cp node_modules/@fontsource-variable/geist-mono/files/*.woff2  app/assets/fonts/
# Optionally rename to match the filenames @font-face expects.
```

### Option C — manual download

Visit https://vercel.com/font, download the .woff2 zips, extract, and place the matching filenames here.

## Why self-host

Per `architecture.md` §11.3 + `PRD.md` §13.3:

- No third-party Google Fonts CDN round-trip (privacy, FOUT, latency).
- `font-display: swap` is configured centrally in `main.css` so all weights share one strategy.
- Total font bundle budget: ≤ 80 KB per route per `PRD.md` §13.4.

## Subsetting (optional)

If a `.woff2` exceeds 100 KB, subset for Latin + Latin-Ext using `glyphhanger` or `fonttools`. Keep original as fallback.

## Verification

After dropping files here, run `npm run dev` and check DevTools → Network → font. Both Geist Sans and Geist Mono should appear with `font-display: swap` (no FOIT).
