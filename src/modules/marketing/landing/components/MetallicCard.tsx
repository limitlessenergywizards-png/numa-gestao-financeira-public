'use client';

import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface MetallicCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "default" | "elevated" | "glass";
  hoverGlow?: boolean;
  borderAnimation?: boolean;
}

export const MetallicCard = forwardRef<HTMLDivElement, MetallicCardProps>(
  ({ className, children, variant = "default", hoverGlow = true, borderAnimation = false, ...props }, ref) => {
    const variants = {
      default: "bg-dark-surface border-dark-border",
      elevated: "bg-dark-elevated border-metallic-700/30",
      glass: "bg-metallic-800/60 backdrop-blur-xl border-metallic-600/20",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-xl lg:rounded-2xl border overflow-hidden",
          "transition-[transform,box-shadow,border-color] duration-300",
          variants[variant],
          hoverGlow && "hover:border-metallic-400/50 hover:shadow-metallic-glow",
          className
        )}
        whileHover={hoverGlow ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {/* Specular highlight at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-metallic-300/30 to-transparent" />
        
        {/* Animated border glow */}
        {borderAnimation && (
          <div className="absolute inset-0 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-[-1px] rounded-xl lg:rounded-2xl bg-gradient-to-r from-metallic-500/0 via-metallic-400/50 to-metallic-500/0 animate-spotlight" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

MetallicCard.displayName = "MetallicCard";
