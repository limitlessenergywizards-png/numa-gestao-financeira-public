"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const colorVariants = {
  default: "bg-primary",
  success: "bg-green-600",
  warning: "bg-amber-500",
  destructive: "bg-red-600",
};

interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "ref"> {
  value?: number;
  color?: keyof typeof colorVariants;
  showShimmer?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, color = "default", showShimmer, ...props }, ref) => {
  const clampedValue = Math.min(100, Math.max(0, value || 0));

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <motion.div
        className={cn("h-full rounded-full relative overflow-hidden", colorVariants[color])}
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {showShimmer && clampedValue < 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%]" />
        )}
      </motion.div>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
