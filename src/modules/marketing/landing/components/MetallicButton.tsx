import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface MetallicButtonProps extends ButtonProps {
  shimmer?: boolean;
  glow?: boolean;
}

export const MetallicButton = forwardRef<HTMLButtonElement, MetallicButtonProps>(
  ({ className, shimmer = true, glow = true, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-r from-metallic-500 via-metallic-400 to-metallic-500",
          "text-white font-montserrat font-semibold",
          "border border-metallic-300/30",
          "shadow-metallic-md hover:shadow-metallic-lg",
          "transition-[box-shadow,filter] duration-150",
          glow && "animate-glow-pulse",
          className
        )}
        {...props}
      >
        {/* Shimmer effect overlay */}
        {shimmer && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"
            style={{ backgroundSize: "200% 100%" }}
          />
        )}
        
        {/* Specular highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-metallic-100/50 to-transparent" />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Button>
    );
  }
);

MetallicButton.displayName = "MetallicButton";
