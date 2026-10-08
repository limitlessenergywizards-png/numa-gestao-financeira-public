'use client';

import { motion, HTMLMotionProps, useMotionValue, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnhancedGlassmorphismCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode;
  variant?: "default" | "elevated" | "deep" | "floating";
  layers?: 1 | 2 | 3;
  specularReflection?: boolean;
  mouseTracking?: boolean;
  glowOnHover?: boolean;
  shimmer?: boolean;
  breathe?: boolean;
}

export function EnhancedGlassmorphismCard({
  children,
  variant = "default",
  layers = 1,
  specularReflection = true,
  mouseTracking = false,
  glowOnHover = true,
  shimmer = false,
  breathe = false,
  className,
  ...props
}: EnhancedGlassmorphismCardProps) {
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for desktop only
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 300, damping: 30 });
  const reflectionX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]), { stiffness: 300, damping: 30 });
  const reflectionY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-20, 20]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseTracking || isMobile || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const baseStyles = "relative rounded-2xl lg:rounded-3xl overflow-hidden transition-[border-color,box-shadow] duration-500";

  const variantStyles = {
    default: cn(
      "bg-dark-elevated/80 border border-metallic-600/20",
      "backdrop-blur-xl md:backdrop-blur-2xl"
    ),
    elevated: cn(
      "bg-dark-elevated/90 border border-metallic-500/25",
      "backdrop-blur-2xl md:backdrop-blur-3xl",
      "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(143,191,122,0.1)]"
    ),
    deep: cn(
      "bg-gradient-to-br from-dark-elevated/95 to-dark-surface/90",
      "border border-metallic-400/20",
      "backdrop-blur-3xl md:backdrop-blur-4xl",
      "shadow-[0_16px_64px_rgba(0,0,0,0.5),0_0_1px_rgba(143,191,122,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
    ),
    floating: cn(
      "bg-dark-surface/60 border border-metallic-600/15",
      "backdrop-blur-lg md:backdrop-blur-xl"
    ),
  };

  const glowStyles = glowOnHover
    ? "hover:shadow-[0_20px_80px_rgba(61,122,82,0.2),0_0_60px_rgba(107,166,115,0.1)] hover:border-metallic-400/40"
    : "";

  const breatheStyles = breathe ? "animate-glass-pulse" : "";
  const shimmerStyles = shimmer ? "glass-shimmer" : "";

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={mouseTracking && !isMobile ? { 
        rotateX, 
        rotateY,
        transformStyle: "preserve-3d",
      } : undefined}
      className={cn(
        baseStyles,
        variantStyles[variant],
        glowStyles,
        breatheStyles,
        shimmerStyles,
        "perspective-1000",
        className
      )}
      {...props}
    >
      {/* Layer effects for multi-layer glass */}
      {layers >= 2 && (
        <div className="absolute -inset-4 rounded-3xl bg-metallic-600/5 backdrop-blur-sm -z-10" />
      )}
      {layers >= 3 && (
        <div className="absolute -inset-8 rounded-[2rem] bg-metallic-700/3 backdrop-blur-xs -z-20" />
      )}

      {/* Specular reflection overlay */}
      {specularReflection && (
        <motion.div 
          className="absolute inset-0 rounded-inherit pointer-events-none z-10"
          style={mouseTracking && !isMobile ? {
            background: `radial-gradient(circle at calc(50% + ${reflectionX.get()}px) calc(30% + ${reflectionY.get()}px), rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 30%, transparent 60%)`,
          } : {
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 30%, transparent 60%)",
          }}
        />
      )}

      {/* Inner glow */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-br from-metallic-400/5 via-transparent to-metallic-600/3 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20">{children}</div>

      {/* Bottom highlight line */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-400/20 to-transparent pointer-events-none" />
    </motion.div>
  );
}
