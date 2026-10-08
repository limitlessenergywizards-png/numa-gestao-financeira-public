'use client';

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassOrbProps extends Omit<HTMLMotionProps<"div">, 'size'> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  color?: "metallic" | "gold" | "red" | "blue";
  blur?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  delay?: number;
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-48 h-48",
  lg: "w-72 h-72",
  xl: "w-96 h-96",
  "2xl": "w-[500px] h-[500px]",
};

const blurClasses = {
  sm: "blur-[40px]",
  md: "blur-[80px]",
  lg: "blur-[120px]",
  xl: "blur-[160px]",
};

const colorClasses = {
  metallic: "bg-gradient-to-br from-metallic-500/30 via-metallic-400/20 to-metallic-600/10",
  gold: "bg-gradient-to-br from-gold-400/20 via-gold-500/15 to-gold-600/5",
  red: "bg-gradient-to-br from-red-500/20 via-red-400/10 to-transparent",
  blue: "bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent",
};

export function GlassOrb({
  size = "md",
  color = "metallic",
  blur = "lg",
  animate = true,
  delay = 0,
  className,
  ...props
}: GlassOrbProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay }}
      className={cn(
        "rounded-full absolute pointer-events-none",
        sizeClasses[size],
        blurClasses[blur],
        colorClasses[color],
        animate && "animate-breathe",
        className
      )}
      {...props}
    />
  );
}
