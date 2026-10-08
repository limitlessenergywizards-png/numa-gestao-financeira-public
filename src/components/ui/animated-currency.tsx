'use client';

import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedCurrencyProps {
  value: number;
  symbol?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  duration?: number;
  decimals?: number;
  colorize?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

/**
 * Animated currency display component with count-up effect.
 * 
 * Uses requestAnimationFrame for smooth 60fps animations without re-renders.
 * Follows the same visual standard as Currency component.
 * 
 * @example
 * <AnimatedCurrency value={84300.23} size="3xl" />
 * <AnimatedCurrency value={totalReceitas} size="2xl" colorize />
 */
export const AnimatedCurrency = memo(function AnimatedCurrency({
  value,
  symbol = "R$",
  size = "md",
  duration = 1200,
  decimals = 2,
  colorize = false,
  className,
}: AnimatedCurrencyProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!spanRef.current) return;

    // Cancel any existing animation
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const startValue = prevValueRef.current;
    const endValue = Math.abs(value);
    const startTime = performance.now();

    function formatNumber(num: number): string {
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart for smooth deceleration
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
  }, [value, duration, decimals]);

  const isNegative = value < 0;
  const colorClass = colorize
    ? isNegative
      ? "text-destructive"
      : value > 0
        ? "text-success"
        : ""
    : "";

  return (
    <span
      className={cn(
        "font-semibold tabular-nums whitespace-nowrap",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {isNegative && "- "}
      <span className="text-[0.7em] mr-0.5 font-medium opacity-80">
        {symbol}
      </span>
      <span ref={spanRef}>
        {Math.abs(value).toLocaleString("pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
    </span>
  );
});

AnimatedCurrency.displayName = 'AnimatedCurrency';
