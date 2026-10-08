/**
 * Application Configuration Constants
 * 
 * Centralized configuration for the entire application.
 * Use SCREAMING_SNAKE_CASE for all constants.
 */

// ============================================
// APPLICATION METADATA
// ============================================

export const APP_CONFIG = {
  /** Application display name */
  NAME: 'Numa Gestão Financeira',
  
  /** Short name for mobile/PWA */
  SHORT_NAME: 'Numa',
  
  /** Application version (sync with package.json) */
  VERSION: '1.0.0',
  
  /** Support email */
  SUPPORT_EMAIL: 'suporte@numa.com.br',
  
  /** WhatsApp support number */
  WHATSAPP_NUMBER: '+5511999999999',
} as const;

// ============================================
// UI BEHAVIOR TIMINGS (milliseconds)
// ============================================

export const TIMING = {
  /** Debounce delay for search inputs */
  DEBOUNCE_DELAY: 300,
  
  /** Toast notification duration */
  TOAST_DURATION: 4000,
  
  /** Loading skeleton minimum display time */
  SKELETON_MIN_DISPLAY: 300,
  
  /** Auto-save delay for forms */
  AUTOSAVE_DELAY: 1000,
  
  /** Animation durations */
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
} as const;

// ============================================
// PAGINATION CONFIGURATION
// ============================================

export const PAGINATION = {
  /** Default items per page */
  DEFAULT_PAGE_SIZE: 50,
  
  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
  
  /** Maximum items for virtual scrolling */
  VIRTUAL_LIST_THRESHOLD: 100,
} as const;

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE = {
  /** LocalStorage cache key prefix */
  STORAGE_PREFIX: 'numa_',
  
  /** Query cache max age (24 hours) */
  MAX_AGE: 1000 * 60 * 60 * 24,
  
  /** Default stale time for queries (30 seconds) */
  DEFAULT_STALE_TIME: 1000 * 30,

  /** Default garbage collection time (10 minutes) */
  DEFAULT_GC_TIME: 1000 * 60 * 10,
} as const;

// ============================================
// FILE UPLOAD LIMITS
// ============================================

export const UPLOAD = {
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  /** Allowed image types */
  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  
  /** Allowed document types */
  DOCUMENT_TYPES: ['application/pdf', 'application/xml', 'text/xml'] as const,
} as const;

// ============================================
// VALIDATION LIMITS
// ============================================

export const VALIDATION = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 500,
  
  /** Maximum notes length */
  MAX_NOTES_LENGTH: 2000,
  
  /** Maximum file name length */
  MAX_FILENAME_LENGTH: 100,
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  /** Enable OCR scanning */
  OCR_ENABLED: true,
  
  /** Enable AI insights */
  AI_INSIGHTS_ENABLED: true,
  
  /** Enable gamification journey */
  JOURNEY_ENABLED: true,
  
  /** Enable push notifications */
  PUSH_NOTIFICATIONS_ENABLED: true,
} as const;
