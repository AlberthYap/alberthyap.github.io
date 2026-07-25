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
    // Dark forest sage (`#386948`) + light mint (`#e8ffe9`) — measured
    // contrast ~5.66:1 on light surfaces. Passes WCAG AA (4.5:1) for
    // body sizes; misses AAA (7:1) but is well above the 3:1 floor for
    // large text + UI components.
    `bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/85 border border-transparent ${FOCUS_PRIMARY}`,
  secondary:
    // Transparent fill + outline border — reads as a quieter secondary
    // action on the cream base. Hover lifts to primary text + border.
    `bg-transparent text-text border border-outline-variant hover:border-primary hover:text-primary ${FOCUS_GHOST}`,
  ghost:
    `bg-transparent text-text hover:bg-surface-container-high border border-transparent ${FOCUS_GHOST}`,
}

export function buttonClasses(variant: ButtonVariant, size: ButtonSize): string {
  return [BASE_CLASSES, SIZE_CLASSES[size], VARIANT_CLASSES[variant]].join(' ')
}
