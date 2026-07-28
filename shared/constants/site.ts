/**
 * Site-wide constants. Single source of truth for brand identity, navigation,
 * and social URLs reused across components.
 *
 * Bio and skill content live in **Nuxt Content** as of Phase 3.x:
 *   - `content/about.md` (singleton about page) — frontmatter `tagline`
 *     + body markdown
 *   - `content/experience/*.md` — per-role entries with skill groups in
 *     frontmatter; Skills.vue aggregates across entries.
 *
 * This file intentionally retains only what stays the same across edits:
 * brand, navigation, social URLs.
 *
 * Navigation taxonomy (Phase 4 v2.x):
 *   - `NAV_LINKS`      → home-page section anchors. Scroll-spy in
 *     `app/composables/useActiveSection.ts` lights up the matching link
 *     as the user scrolls; pages/index.vue anchors to the side of the
 *     page.
 *   - `SITE_TECH_LINKS` → top-level destinations that live on other
 *     routes (/tools) or off-site (GitHub, LinkedIn). These live in a
 *     secondary cluster in `Navbar.vue` and don't participate in the
 *     scroll-spy active state.
 */

export const SITE_NAME = 'Alberth Yaputra'
export const SITE_ROLE = 'Frontend Engineer'
export const SITE_LEAD = 'Building accessible, performant web interfaces — from design tokens to production bundle.'

/**
 * Primary nav — all hash anchors for the home page's narrative sections.
 * Section ids (`hero`, `about`, `skills`, `experience`, `projects`)
 * match the `data-section-id` attributes the IO binds in pages/index.vue.
 */
export const NAV_LINKS = [
  { label: 'Home', to: '/#hero' },
  { label: 'About', to: '/#about' },
  { label: 'Skills', to: '/#skills' },
  { label: 'Experience', to: '/#experience' },
  { label: 'Projects', to: '/#projects' },
] as const

/**
 * Secondary nav — destinations that aren't scroll-spy targets. Rendered
 * in Navbar's right cluster (theme toggle + tools link + primary CTA)
 * and in the global footer.
 */
export const SITE_TECH_LINKS = [
  { label: 'Tools', to: '/tools' },
  { label: 'GitHub', href: 'https://github.com/AlberthYap', external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alberth-yaputra', external: true },
] as const

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/AlberthYap' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alberth-yaputra' },
] as const
