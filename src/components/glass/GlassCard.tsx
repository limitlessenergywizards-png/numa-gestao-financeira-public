'use client';

import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  variant?: "default" | "warm" | "subtle" | "elevated";
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  glow?: "gold" | "green" | "success" | "danger" | "info" | "none";
  shine?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      variant = "default",
      padding = "md",
      hover = false,
      glow = "none",
      shine = false,
      className,
      onClick,
    },
    ref
  ) {
    const variants = {
      default: "glass-premium",
      warm: "glass-premium-warm",
      subtle: "glass-subtle",
      elevated:
        "glass-premium bg-glass-elevated border-glass-border-light shadow-glass-lg",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-5 md:p-6",
      lg: "p-6 md:p-8",
    };

    const glows = {
      none: "",
      gold: "shadow-gold-glow-sm hover:shadow-gold-glow",
      green: "shadow-green-glow",
      success: "shadow-[0_0_20px_hsla(160_84%_39%_/_0.2)]",
      danger: "shadow-[0_0_20px_hsla(0_84%_60%_/_0.2)]",
      info: "shadow-[0_0_20px_hsla(199_89%_48%_/_0.2)]",
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          variants[variant],
          paddings[padding],
          glows[glow],
          hover &&
            "transition-[transform,box-shadow] duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-glass-xl",
          shine && "shine-overlay",
          "gpu-accelerated relative overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
