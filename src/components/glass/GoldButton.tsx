import { ReactNode, forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export const GoldButton = forwardRef<HTMLButtonElement, GoldButtonProps>(
  function GoldButton(
    {
      children,
      variant = "primary",
      size = "md",
      glow = false,
      className,
      ...props
    },
    ref
  ) {
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variants = {
      primary: cn(
        "bg-gold-gradient text-numa-deep font-semibold",
        "hover:brightness-110 hover:shadow-gold-glow",
        "active:brightness-95",
        glow && "shadow-gold-glow animate-gold-pulse"
      ),
      outline: cn(
        "bg-transparent border border-gold-400/40 text-gold-400",
        "hover:bg-gold-500/10 hover:border-gold-400/60",
        "active:bg-gold-500/20"
      ),
      ghost: cn(
        "bg-transparent text-gold-400",
        "hover:bg-gold-500/10",
        "active:bg-gold-500/20"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl",
          "transition-[color,background-color,border-color,box-shadow,filter] duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-glass-base",
          "disabled:opacity-50 disabled:pointer-events-none",
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
