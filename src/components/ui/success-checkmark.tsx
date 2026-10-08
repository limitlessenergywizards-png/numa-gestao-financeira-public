"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

interface SuccessCheckmarkProps {
  size?: keyof typeof sizeMap;
  className?: string;
  onComplete?: () => void;
}

export function SuccessCheckmark({ size = "md", className, onComplete }: SuccessCheckmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const instant = prefersReducedMotion ?? false;

  return (
    <motion.svg
      className={cn(sizeMap[size], "text-green-500", className)}
      viewBox="0 0 24 24"
      fill="none"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: instant
              ? { duration: 0 }
              : { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          },
        }}
      />
      <motion.path
        d="M8 12l3 3 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: instant
              ? { duration: 0 }
              : { delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        onAnimationComplete={() => onComplete?.()}
      />
    </motion.svg>
  );
}
