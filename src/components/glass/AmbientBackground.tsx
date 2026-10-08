import { memo } from "react";
import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  intensity?: "subtle" | "normal" | "intense";
  showGrid?: boolean;
  showNoise?: boolean;
  className?: string;
}

export const AmbientBackground = memo(function AmbientBackground({
  intensity = "normal",
  showGrid = true,
  showNoise = true,
  className,
}: AmbientBackgroundProps) {
  const opacityMap = {
    subtle: { green: 0.2, gold: 0.05, center: 0.1 },
    normal: { green: 0.35, gold: 0.08, center: 0.15 },
    intense: { green: 0.5, gold: 0.12, center: 0.2 },
  };

  const opacity = opacityMap[intensity];

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* Base color - adapts to theme */}
      <div className="absolute inset-0 bg-background dark:bg-glass-void" />

      {/* Ambient green orb - top left */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full animate-breathe gpu-accelerated"
        style={{
          background: `radial-gradient(circle, hsla(168 37% 17% / ${opacity.green}) 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Ambient gold orb - bottom right */}
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full animate-breathe gpu-accelerated"
        style={{
          background: `radial-gradient(circle, hsla(42 50% 56% / ${opacity.gold}) 0%, transparent 60%)`,
          filter: "blur(100px)",
          animationDelay: "-3s",
        }}
      />

      {/* Subtle center glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full animate-glow-breathe gpu-accelerated"
        style={{
          background: `radial-gradient(circle, hsla(168 30% 25% / ${opacity.center}) 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Subtle grid pattern */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsla(168 37% 17% / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, hsla(168 37% 17% / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      )}

      {/* Noise texture for realism */}
      {showNoise && (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
});
