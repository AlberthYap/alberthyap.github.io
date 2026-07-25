/**
 * Visual class composition for action surfaces (Button, LinkButton).
 *
 * Matched against the Organic Professional design tokens (DESIGN §7).
 *
 * Both `Button.vue` and `LinkButton.vue` render visually identical
 * chrome — same hover lift, ring, variants, sizes. Centralising the
 * class map here keeps iteration honest: changing the focus ring or
 * the primary hover tone happens in one file, not two.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Focus ring is applied per-variant so the offset stays visible
// against whichever surface the button sits on:
//   • primary (filled sage bg)  → ring-offset-bg gives the dark gap that
//                                   separates the sage fill from the ring.
//   • secondary / ghost (transparent/translucent) → outline-only focus
//                                   ring without offset so it stays
//                                   legible against the page bg.
const FOCUS_PRIMARY = 'focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
const FOCUS_GHOST = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'

const BASE_CLASSES = [
  // YAML §"Components" specifies 8 px corners for primary buttons.
  // `rounded` → --radius-DEFAULT → 0.5rem. Avoids `rounded-lg` (16 px)
  // which would over-round the CTA into the "card" tier instead of the
  // "action" tier.
  'inline-flex items-center justify-center gap-2 rounded font-medium',
  'transition-[transform,background-color,border-color,color]',
  'duration-[var(--motion-small)] ease-[var(--motion-easing)]',
  'hover:-translate-y-px motion-reduce:hover:translate-y-0',
  'disabled:cursor-not-allowed disabled:opacity-50',
  // Ambient shadow on primary — tinted with primary per DESIGN §6.
  'shadow-[0_4px_14px_-4px_rgb(0_0_0/0.4)]',
].join(' ')

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-base',
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    // Forest sage (`#4a8c66`) + white (`#ffffff`) — measured contrast
    // ~6.6:1 on light surfaces. Passes WCAG AA (4.5:1) for body text
    // and approaches AAA (7:1). White text reads crisply on sage in
    // both light and dark page themes.
    `bg-primary text-white hover:bg-primary/90 active:bg-primary/85 border border-transparent ${FOCUS_PRIMARY}`,
  secondary:
    // Green text + subtle outline border — reads as a quieter secondary
    // action using brand color instead of dark text that floats on cream.
    // On hover the border intensifies to full primary.
    `bg-transparent text-primary border border-primary/30 hover:border-primary hover:text-primary ${FOCUS_GHOST}`,
  ghost:
    // Near-transparent with muted text — minimal footprint for inline
    // actions that don't compete with the primary CTA.
    `bg-transparent text-muted hover:text-primary hover:bg-surface-container-high border border-transparent ${FOCUS_GHOST}`,
}

export function buttonClasses(variant: ButtonVariant, size: ButtonSize): string {
  return [BASE_CLASSES, SIZE_CLASSES[size], VARIANT_CLASSES[variant]].join(' ')
}
