'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * Lazy visibility hook using IntersectionObserver
 * Only loads components when they enter the viewport
 * Reduces initial render load significantly
 */
export function useLazyVisible(rootMargin = '100px') {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: immediately visible if no IntersectionObserver
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isVisible };
}

/**
 * Prefers reduced motion check
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
