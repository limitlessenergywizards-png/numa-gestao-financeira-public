'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassRingProps {
  size?: number;
  thickness?: number;
  className?: string;
  animate?: boolean;
  reverse?: boolean;
  duration?: number;
  delay?: number;
}

export function GlassRing({
  size = 400,
  thickness = 1,
  className,
  animate = true,
  reverse = false,
  duration = 20,
  delay = 0,
}: GlassRingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay }}
      className={cn(
        "absolute rounded-full pointer-events-none",
        animate && (reverse ? "animate-orbital-reverse" : "animate-orbital"),
        className
      )}
      style={{
        width: size,
        height: size,
        border: `${thickness}px solid`,
        borderColor: "rgba(107, 166, 115, 0.15)",
        background: "linear-gradient(135deg, rgba(143, 191, 122, 0.05) 0%, transparent 50%, rgba(61, 122, 82, 0.03) 100%)",
        boxShadow: "inset 0 0 20px rgba(107, 166, 115, 0.05), 0 0 40px rgba(61, 122, 82, 0.05)",
        animationDuration: `${duration}s`,
      }}
    >
      {/* Highlight point on the ring */}
      <div 
        className="absolute w-3 h-3 rounded-full bg-metallic-300/40 blur-sm"
        style={{
          top: '50%',
          left: 0,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div 
        className="absolute w-2 h-2 rounded-full bg-metallic-200/30 blur-sm"
        style={{
          top: 0,
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </motion.div>
  );
}
