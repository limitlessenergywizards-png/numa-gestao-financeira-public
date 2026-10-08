'use client';

import { useParallax } from "@/hooks/useParallax";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface ParallaxOrbProps {
  speed: number;
  className: string;
  delay?: number;
}

function ParallaxOrb({ speed, className, delay = 0 }: ParallaxOrbProps) {
  const offset = useParallax(speed);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, delay }}
      className={className}
      style={{ transform: `translateY(${offset}px)` }}
    />
  );
}

/**
 * Mobile-optimized static background - CSS only, no JS animations
 * Uses metallic green tones for premium look
 */
function MobileBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Metallic green orbs - static */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-metallic-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] bg-metallic-400/8 rounded-full blur-[60px]" />
      
      {/* Gold accent orb */}
      <div className="absolute top-[40%] right-[15%] w-[200px] h-[200px] bg-gold-400/6 rounded-full blur-[70px]" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--dark-base))_70%)]" />
    </div>
  );
}

/**
 * Full parallax background for desktop with metallic green theme
 */
function DesktopBackground() {
  const patternOffset = useParallax(0.02);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Layer 1 - Slowest (far back) - Metallic green orbs */}
      <ParallaxOrb
        speed={0.05}
        delay={0}
        className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-metallic-500/10 rounded-full blur-[150px]"
      />
      <ParallaxOrb
        speed={0.05}
        delay={0.2}
        className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-metallic-400/8 rounded-full blur-[140px]"
      />

      {/* Layer 2 - Medium speed - Gold accent */}
      <ParallaxOrb
        speed={0.1}
        delay={0.4}
        className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-gold-400/8 rounded-full blur-[120px]"
      />
      <ParallaxOrb
        speed={0.1}
        delay={0.6}
        className="absolute top-[60%] left-[15%] w-[350px] h-[350px] bg-metallic-600/60 rounded-full blur-[100px]"
      />

      {/* Layer 3 - Faster (closer) - Specular highlights */}
      <ParallaxOrb
        speed={0.15}
        delay={0.8}
        className="absolute top-[20%] left-[40%] w-[250px] h-[250px] bg-metallic-300/12 rounded-full blur-[80px]"
      />

      {/* Chess pattern with metallic green */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            hsl(var(--metallic-green-400) / 0.3) 40px,
            hsl(var(--metallic-green-400) / 0.3) 80px
          )`,
          transform: `translateY(${patternOffset}px)`,
        }}
      />

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--dark-base))_70%)]" />
    </div>
  );
}

export function ParallaxBackground() {
  const isMobile = useIsMobile();

  // Render lightweight static background on mobile
  if (isMobile) {
    return <MobileBackground />;
  }

  // Full parallax on desktop
  return <DesktopBackground />;
}
