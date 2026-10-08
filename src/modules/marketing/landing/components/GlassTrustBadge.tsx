'use client';

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassTrustBadgeProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export function GlassTrustBadge({ children, index = 0, className }: GlassTrustBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={cn(
        "relative group",
        className
      )}
    >
      {/* Glass background */}
      <div className="relative px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-dark-surface/60 backdrop-blur-lg border border-metallic-600/20 hover:border-metallic-400/30 transition-[border-color] duration-300">
        {/* Specular highlight */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-metallic-300/10 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-5 h-5 rounded-full bg-metallic-500/20 flex items-center justify-center">
            <Check className="h-3 w-3 text-metallic-300" />
          </div>
          <span className="text-sm text-metallic-100/80 font-medium whitespace-nowrap">
            {children}
          </span>
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-metallic-400/5 pointer-events-none" />
      </div>
    </motion.div>
  );
}

interface GlassTrustBadgeConnectorProps {
  className?: string;
}

export function GlassTrustBadgeConnector({ className }: GlassTrustBadgeConnectorProps) {
  return (
    <div className={cn(
      "hidden md:block lg:hidden xl:block w-4 md:w-8 xl:w-8 h-px bg-gradient-to-r from-metallic-500/30 via-metallic-400/20 to-metallic-500/30",
      className
    )} />
  );
}
