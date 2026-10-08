import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetallicBadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
}

export function MetallicBadge({ 
  children, 
  variant = "default", 
  size = "md",
  className,
  icon 
}: MetallicBadgeProps) {
  const variants = {
    default: "bg-metallic-800/50 border-metallic-600/30 text-metallic-200",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    gold: "bg-gold-400/10 border-gold-400/30 text-gold-400",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        "backdrop-blur-sm transition-colors duration-200",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
