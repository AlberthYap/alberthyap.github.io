# portfolio-web-v2

Portfolio site for **Alberth Yaputra**, Frontend Engineer. Built with Nuxt 4, Tailwind CSS v4, and Nuxt Content. Includes a seven-tool developer utility suite that runs entirely in the browser — no uploads, no sign-up.

## Features

- **Portfolio pages** — narrative single-page home (hero, about, skills, experience, projects) plus project case studies at `/projects/[slug]`.
- **Tool suite** — seven interactive, local-first developer tools at `/tools/[slug]`, all client-side with no backend:

  | Tool | Route | What it does |
  |---|---|---|
  | Delimiter Converter | `/tools/delimiter` | Paste CSV/TSV/JSON, convert instantly between delimiter formats; sidebar with conversion mode, format presets, quote handling, cleanup, and advanced transforms |
  | JSON Formatter | `/tools/json-formatter` | Format, validate, and minify JSON with error highlighting, key sorting, and copy/download |
  | Regex Tester | `/tools/regex-tester` | Live regex matching against sample text with capture-group breakdown |
  | CSV Cleaner | `/tools/csv-cleaner` | Trim whitespace, drop blank lines, dedupe rows, and normalise quotes |
  | Text Diff | `/tools/text-diff` | Side-by-side line-level diff (LCS) with unified-diff copy |
  | JSON ⇄ CSV Converter | `/tools/json-csv-converter` | Convert arrays of objects to CSV tables and back, with type coercion |
  | YAML ⇄ JSON Converter | `/tools/yaml-json` | Convert YAML to JSON and back, preserving nested structure |

- **Privacy-first** — every tool runs locally in the browser. No uploads, no tracking, no sign-up.
- **Accessible** — WCAG 2.1 AA: keyboard-operable, semantic landmarks, skip-to-content, reduced-motion support, and a contrast-checked design token system.
- **Dark mode** — device-preference default with a no-flash inline resolver and manual toggle.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Nuxt](https://nuxt.com) 4.5 (Vue 3.5, Nitro 2.13) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 via `@tailwindcss/vite` + design tokens in `app/assets/css/main.css` |
| Content | [@nuxt/content](https://content.nuxt.com) v3 (collections: `projects`, `tools`, `about`, `experience`, `personalSkills`) |
| Validation | Zod schemas in `shared/schemas/` — single source of truth for build-time validation and TS types |
| Tests | Vitest 3 + @vue/test-utils (unit), Playwright (E2E) |
| Fonts | Nunito Sans (UI), Literata (serif display), Geist Mono (code) |

## Getting Started

```bash
# Install dependencies
npm install

# Development server at http://localhost:3000
npm run dev
```

> **Note:** the development server binds to `PORT` when set. Playwright's E2E config expects `http://localhost:3000`, so run E2E with `PORT=3000` explicitly (see [Testing](#testing)).

## Testing

### Unit tests (Vitest + happy-dom)

```bash
npm run test:unit          # run once
npm run test:unit:watch    # watch mode
```

390 tests across 31 files: component contracts, composables, Zod schemas, utility functions (`app/utils/jsonTools.ts`), and the build-time HTML sanitizer (`shared/sanitizeHtml.ts`).

### E2E tests (Playwright)

```bash
npx playwright test          # run once (PORT env optional, default 3000)
npm run test:e2e:ui          # interactive UI mode
```

Playwright spins up a Nuxt server via its `webServer` config (dev locally, production preview in CI) and runs against Chromium. `PORT` env drives both the server and `baseURL`, so they can never drift. Coverage: navigation/scroll-spy, theme toggle, accessibility smoke tests, project pages, and tool layouts (320-1440px).

### Typecheck

```bash
npx nuxt typecheck
```

Requires TypeScript ≥ 5.9 (the Nuxt-generated config uses `libReplacement`). The root `tsconfig.json` extends `./.nuxt/tsconfig.json` only — do not add a manual `include`/`references` there, or Nuxt auto-import types will be dropped and `nuxt typecheck` breaks.

## Building for Production

```bash
npm run build        # server build (nuxt build)
npm run generate     # static prerender (nuxt generate)
npm run preview      # preview a build
```

`nuxt.config.ts` prerenders `/`, `/projects`, `/tools` (crawl-linked routes) with `failOnError: true`, and applies security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) to every route.

## Project Structure

```
app/
  assets/css/main.css        # design tokens, Tailwind v4 theme, motion
  components/
    ui/                      # design-system primitives (Button, Card, Badge, …)
    layout/                  # Navbar, Footer, PageContainer
    portfolio/               # Hero, About, Skills, Experience, ProjectCard
    tools/                   # DelimiterTool, JsonFormatterTool, RegexTesterTool,
                             # CsvCleanerTool, TextDiffTool, JsonCsvConverterTool,
                             # YamlJsonTool
  pages/
    index.vue                # single-page home with scroll-spy sections
    projects/                # index + [slug] case studies
    tools/                   # index + [slug] tool pages
content/
  projects/*.md              # case-study narratives (frontmatter + body)
  tools/*.yml                # tool metadata: slug, title, description, seo
  experience/*.md            # per-role entries
  about.md                   # about singleton
  skills/personal-skills.yml # skill groups
shared/
  constants/site.ts          # brand, nav, social URLs
  schemas/                   # Zod schemas backing Nuxt Content collections
  types/                     # inferred TS types
modules/home-snapshot.ts     # build-time pre-computed home content payload
tests/
  unit/                      # Vitest suites (components, composables, schemas, utils)
  e2e/                       # Playwright specs
```

## Content Editing

All content is markdown/YAML in `content/` and validated at build time by Zod schemas in `shared/schemas/`.

- **Add a project:** create `content/projects/your-project.md` with `ProjectSchema` frontmatter (title, summary, status, tech, thumbnail).
- **Add a tool:** create `content/tools/your-tool.yml` with `ToolSchema` metadata, then wire the interactive component into `app/pages/tools/[slug].vue`.
- **Add a role:** create `content/experience/company-years.md` with `ExperienceSchema` frontmatter; `Skills.vue` aggregates skill groups across entries.

## Repository Hygiene

This repo follows documented engineering standards in `.agents/` (component rules, architecture, AI development rules). Key conventions:

- Semantic color tokens only — no raw hex values in components.
- Components colocated with their tests; UI primitives are accessible and keyboard-operable.
- Zero em-dashes in user-visible copy (taste-skill compliance).
