/**
 * Site-wide constants. Single source of truth for brand identity, navigation,
 * social URLs, and About/Skills content reused across components.
 *
 * Bio and skill groups are PHASE 3 placeholder copy — replace with curated
 * content (or migrate to `content/about.md` + `content/experience/*.md` once
 * the experience collection lands in Phase 3.x).
 */

export const SITE_NAME = 'Alberth Yaputra'
export const SITE_ROLE = 'Frontend Engineer'
export const SITE_LEAD = 'Building accessible, performant web interfaces — from design tokens to production bundle.'

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Tools', to: '/tools' },
] as const

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/AlberthYaputra' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alberth-yaputra' },
] as const

export const ABOUT_BIO = "I design and ship user-facing interfaces end to end — from the design-token layer through the production bundle. Currently focused on Vue, TypeScript, and design systems that stay maintainable past the first release."

export interface SkillGroup {
  title: string
  items: readonly string[]
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    title: 'Frontend',
    items: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Tailwind CSS', 'Vite'],
  },
  {
    title: 'Tooling',
    items: ['Vitest', 'Playwright', 'ESLint', 'Zod', 'pnpm'],
  },
  {
    title: 'Practices',
    items: ['Design systems', 'A11y (WCAG 2.1 AA)', 'Static-first', 'Performance budgets'],
  },
] as const
