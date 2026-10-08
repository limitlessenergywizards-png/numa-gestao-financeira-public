'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

// Shared scroll state - singleton pattern
let scrollY = 0;
let listeners: Set<() => void> = new Set();
let isListening = false;
let rafId: number | null = null;
let lastUpdate = 0;
const THROTTLE_MS = 16; // ~60fps

function startListening() {
  if (isListening || typeof window === 'undefined') return;
  
  const handleScroll = () => {
    const now = performance.now();
    if (now - lastUpdate < THROTTLE_MS) return;
    
    lastUpdate = now;
    scrollY = window.scrollY;
    
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      listeners.forEach(cb => cb());
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  isListening = true;
  scrollY = window.scrollY;
}

function stopListening() {
  if (!isListening || typeof window === 'undefined') return;
  
  window.removeEventListener('scroll', () => {});
  isListening = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (listeners.size === 1) startListening();
  
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) stopListening();
  };
}

/**
 * Optimized parallax hook with singleton scroll listener
 * - Mobile: returns 0 (no parallax for performance)
 * - Desktop: throttled to 60fps with shared listener
 */
export function useParallax(speed: number = 0.5) {
  const isMobile = useIsMobile();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Disable parallax on mobile for performance
    if (isMobile) {
      setOffset(0);
      return;
    }

    const handleUpdate = () => {
      setOffset(scrollY * speed);
    };

    // Initial value
    handleUpdate();

    // Subscribe to shared scroll listener
    return subscribe(handleUpdate);
  }, [speed, isMobile]);

  return isMobile ? 0 : offset;
}

/**
 * Hook for tracking scroll progress (0 to 1)
 * Optimized with shared listener
 */
export function useScrollProgress() {
  const isMobile = useIsMobile();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isMobile) return;

    const handleUpdate = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = scrollHeight > 0 ? scrollY / scrollHeight : 0;
      setProgress(Math.min(1, Math.max(0, currentProgress)));
    };

    handleUpdate();
    return subscribe(handleUpdate);
  }, [isMobile]);

  return progress;
}

/**
 * Hook for detecting if user has scrolled past a threshold
 */
export function useScrollThreshold(threshold: number = 0.5) {
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const thresholdPx = threshold <= 1 ? scrollHeight * threshold : threshold;
      setIsPastThreshold(scrollY >= thresholdPx);
    };

    handleUpdate();
    return subscribe(handleUpdate);
  }, [threshold]);

  return isPastThreshold;
}

/**
 * Hook for mouse position tracking (desktop only)
 * Returns {x: 0, y: 0} on mobile
 */
export function useMousePosition() {
  const isMobile = useIsMobile();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Skip on mobile - no mouse
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  return position;
}
