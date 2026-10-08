'use client';

import { memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  onPress: () => void;
  className?: string;
}

export const MobileFAB = memo(function MobileFAB({ onPress, className }: MobileFABProps) {
  return (
    <button
      onClick={onPress}
      className={cn(
        "fixed z-50 left-1/2 -translate-x-1/2",
        "bottom-[calc(env(safe-area-inset-bottom)+44px)]",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-gold-400 to-gold-600",
        "flex items-center justify-center",
        "shadow-lg shadow-gold-500/30",
        "active:scale-95 transition-transform",
        "ring-4 ring-background",
        className
      )}
      aria-label="Ações rápidas"
    >
      <Plus className="w-6 h-6 text-numa-deep" />
    </button>
  );
});
