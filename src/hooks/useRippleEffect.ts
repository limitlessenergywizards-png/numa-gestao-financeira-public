'use client';

import { useState, useCallback, useRef } from 'react';

export interface Ripple {
  id: string;
  x: number;
  y: number;
  size: number;
}

interface UseRippleEffectOptions {
  duration?: number;
  color?: string;
  maxScale?: number;
}

export function useRippleEffect(options: UseRippleEffectOptions = {}) {
  const { duration = 600, maxScale = 4 } = options;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Calculate size to cover the entire element
    const size = Math.max(rect.width, rect.height) * 2;
    
    const newRipple: Ripple = {
      id: `ripple-${Date.now()}-${Math.random()}`,
      x,
      y,
      size,
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);
  }, [duration]);

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  return {
    ripples,
    createRipple,
    clearRipples,
    containerRef,
    duration,
    maxScale,
  };
}
