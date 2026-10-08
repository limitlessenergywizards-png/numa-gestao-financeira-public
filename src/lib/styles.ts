/**
 * Reusable Style Classes
 * 
 * Commonly used Tailwind class combinations.
 * Prefer using these over writing inline styles.
 */

// ============================================
// GLASS MORPHISM STYLES
// ============================================

export const GLASS_STYLES = {
  /** Premium glass card - full effect */
  CARD: 'glass-premium rounded-2xl p-6',
  
  /** Subtle glass - lighter effect */
  SUBTLE: 'glass-subtle rounded-xl p-4',
  
  /** Navigation glass */
  NAV: 'glass-nav sticky top-0 z-50',
  
  /** Warm gold-tinted glass */
  WARM: 'glass-premium-warm rounded-2xl p-6',
} as const;

// ============================================
// BUTTON VARIANT STYLES
// ============================================

export const BUTTON_STYLES = {
  /** Primary gold button */
  PRIMARY: 'bg-brand hover:bg-brand-light text-brand-foreground font-semibold',
  
  /** Secondary outline button */
  SECONDARY: 'bg-transparent border border-border hover:bg-accent text-foreground',
  
  /** Ghost button */
  GHOST: 'bg-transparent hover:bg-accent text-foreground',
  
  /** Destructive/danger button */
  DANGER: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  
  /** Success button */
  SUCCESS: 'bg-success hover:bg-success/90 text-success-foreground',
} as const;

// ============================================
// CARD STYLES
// ============================================

export const CARD_STYLES = {
  /** Standard card */
  DEFAULT: 'bg-card border border-border rounded-xl p-6',
  
  /** Elevated card with shadow */
  ELEVATED: 'bg-card border border-border rounded-xl p-6 shadow-lg',
  
  /** Interactive/clickable card */
  INTERACTIVE: 'bg-card border border-border rounded-xl p-6 hover:border-brand/50 hover:shadow-md transition-[border-color,box-shadow] cursor-pointer',
  
  /** Metric/KPI card */
  METRIC: 'bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow',
} as const;

// ============================================
// INPUT STYLES
// ============================================

export const INPUT_STYLES = {
  /** Standard input */
  DEFAULT: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  
  /** Search input with icon */
  SEARCH: 'pl-10 h-10 w-full rounded-md border border-input bg-background',
  
  /** Large input */
  LARGE: 'flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base',
} as const;

// ============================================
// LAYOUT STYLES
// ============================================

export const LAYOUT_STYLES = {
  /** Page container */
  PAGE: 'min-h-screen bg-background',
  
  /** Content container with max width */
  CONTAINER: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  /** Section with vertical spacing */
  SECTION: 'py-8 space-y-6',
  
  /** Grid for cards */
  CARD_GRID: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  
  /** Metric cards grid */
  METRIC_GRID: 'grid gap-4 grid-cols-2 lg:grid-cols-4',
} as const;

// ============================================
// ANIMATION CLASSES
// ============================================

export const ANIMATION_STYLES = {
  /** Fade in animation */
  FADE_IN: 'animate-fade-in',
  
  /** Slide up animation */
  SLIDE_UP: 'animate-slide-up',
  
  /** Floating effect */
  FLOAT: 'animate-float',
  
  /** Gold pulse glow */
  GOLD_PULSE: 'animate-gold-pulse',
  
  /** Glass shimmer */
  SHIMMER: 'animate-glass-shimmer',
} as const;

// ============================================
// STATUS INDICATOR STYLES
// ============================================

export const STATUS_STYLES = {
  /** Success indicator */
  SUCCESS: 'text-success bg-success/10 border-success/20',
  
  /** Warning indicator */
  WARNING: 'text-warning bg-warning/10 border-warning/20',
  
  /** Error indicator */
  ERROR: 'text-destructive bg-destructive/10 border-destructive/20',
  
  /** Info indicator */
  INFO: 'text-info bg-info/10 border-info/20',
  
  /** Muted/neutral indicator */
  MUTED: 'text-muted-foreground bg-muted border-border',
} as const;
