'use client';

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassmorphismCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode;
  variant?: "default" | "elevated" | "floating" | "danger";
  glowColor?: "gold" | "green" | "red" | "metallic" | "none";
  hoverEffect?: boolean;
  borderAnimation?: boolean;
}

export function GlassmorphismCard({
  children,
  variant = "default",
  glowColor = "gold",
  hoverEffect = true,
  borderAnimation = false,
  className,
  ...props
}: GlassmorphismCardProps) {
  const baseStyles = "relative rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-500";

  // Mobile-optimized: reduced blur, higher opacity backgrounds
  const variantStyles = {
    default: cn(
      "bg-[#1B3B34]/70 border border-[#C5A059]/15",
      // Light blur on mobile, full blur on desktop
      "backdrop-blur-sm md:backdrop-blur-[24px]",
      "md:bg-[#1B3B34]/60"
    ),
    elevated: cn(
      "bg-[#17322C]/90 border border-[#C5A059]/20 shadow-2xl",
      // No blur on mobile (heavier background compensates), full blur on desktop
      "md:bg-[#17322C]/80 md:backdrop-blur-[32px]"
    ),
    floating: cn(
      "bg-[#1B3B34]/50 border border-[#C5A059]/10",
      "backdrop-blur-sm md:backdrop-blur-[20px]",
      "md:bg-[#1B3B34]/40"
    ),
    danger: cn(
      "bg-[#1B3B34]/70 border border-red-500/20",
      "backdrop-blur-sm md:backdrop-blur-[24px]",
      "md:bg-[#1B3B34]/60"
    ),
  };

  const glowStyles = {
    gold: "shadow-[0_8px_32px_rgba(197,160,89,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]",
    green: "shadow-[0_8px_32px_rgba(27,59,52,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
    red: "shadow-[0_8px_32px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]",
    metallic: "shadow-[0_8px_32px_rgba(61,122,82,0.2),inset_0_1px_0_rgba(143,191,122,0.1)]",
    none: "",
  };

  const hoverStyles = hoverEffect
    ? "hover:border-[#C5A059]/30 hover:shadow-[0_12px_40px_rgba(197,160,89,0.2)] hover:-translate-y-1"
    : "";

  return (
    <motion.div
      className={cn(
        baseStyles,
        variantStyles[variant],
        glowStyles[glowColor],
        hoverStyles,
        className
      )}
      {...props}
    >
      {/* Inner light reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
      
      {/* Animated border glow - desktop only */}
      {borderAnimation && (
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 hidden md:block">
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-[#C5A059]/0 via-[#C5A059]/30 to-[#C5A059]/0 animate-spotlight" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
