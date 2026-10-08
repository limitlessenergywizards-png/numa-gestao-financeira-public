'use client';

import { useState, useEffect } from 'react';

/**
 * useReducedMotion - Hook for detecting user's motion preferences
 * 
 * Returns true if user has enabled "reduce motion" in their OS settings.
 * Use this to disable or simplify animations for accessibility.
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;
    
    // Check media query
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Handler for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Update initial state in case it changed between server and client
    setPrefersReducedMotion(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};

/**
 * useMotionSafe - Returns whether it's safe to use animations
 * 
 * Opposite of useReducedMotion - returns true when animations are OK
 */
export const useMotionSafe = (): boolean => {
  return !useReducedMotion();
};

/**
 * getReducedMotionPreference - Sync check for reduced motion
 * 
 * Useful for initial render decisions or outside of React
 */
export const getReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
