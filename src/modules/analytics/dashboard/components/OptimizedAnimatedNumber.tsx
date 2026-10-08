'use client';

import { useEffect, useRef, memo } from 'react';

interface OptimizedAnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  locale?: string;
}

/**
 * High-performance animated number component
 * Uses requestAnimationFrame + direct DOM manipulation
 * Zero React re-renders during animation
 */
function OptimizedAnimatedNumberComponent({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  decimals = 2,
  locale = 'pt-BR',
}: OptimizedAnimatedNumberProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!spanRef.current) return;

    // Cancel any running animation
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    // Skip animation for small changes or initial zero
    if (startValue === 0 && endValue === 0) {
      spanRef.current.textContent = formatNumber(0);
      return;
    }

    function formatNumber(num: number): string {
      const formatted = num.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${prefix}${formatted}${suffix}`;
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * eased;

      if (spanRef.current) {
        spanRef.current.textContent = formatNumber(currentValue);
      }

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
        rafIdRef.current = null;
      }
    }

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [value, prefix, suffix, duration, decimals, locale]);

  // Initial render with formatted value
  const initialText = `${prefix}${prevValueRef.current.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;

  return <span ref={spanRef} className="tabular-nums">{initialText}</span>;
}

// Memoize to prevent unnecessary re-renders from parent
export const OptimizedAnimatedNumber = memo(OptimizedAnimatedNumberComponent, (prev, next) => {
  return prev.value === next.value && prev.prefix === next.prefix;
});
