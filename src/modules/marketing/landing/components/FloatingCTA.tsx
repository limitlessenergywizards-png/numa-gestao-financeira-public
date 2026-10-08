'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { useScrollThreshold } from "@/hooks/useParallax";

export function FloatingCTA() {
  const isPastThreshold = useScrollThreshold(0.35);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Reset dismissed state when scrolling back up
  useEffect(() => {
    if (!isPastThreshold && isDismissed) {
      setIsDismissed(false);
    }
  }, [isPastThreshold, isDismissed]);

  // Don't show if user already clicked a CTA
  useEffect(() => {
    const hasClicked = sessionStorage.getItem('numa_cta_clicked');
    if (hasClicked) {
      setHasInteracted(true);
    }
  }, []);

  const handleCTAClick = () => {
    sessionStorage.setItem('numa_cta_clicked', 'true');
  };

  const isVisible = isPastThreshold && !isDismissed && !hasInteracted;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-6 left-0 right-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-md"
        >
          <div className="relative bg-[#1B3B34]/90 backdrop-blur-xl border border-[#C5A059]/30 rounded-2xl p-4 shadow-2xl shadow-black/30">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#C5A059]/10 via-transparent to-[#C5A059]/10 pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#1B3B34] border border-[#C5A059]/30 rounded-full flex items-center justify-center text-[#E5E5E5]/60 hover:text-[#E5E5E5] hover:border-[#C5A059]/50 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>

            <div className="flex items-center gap-4">
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#E5E5E5] truncate">
                  Ainda decidindo? Teste sem compromisso.
                </p>
                <p className="text-xs text-[#E5E5E5]/60">
                  3 dias grátis • Sem cartão
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 pr-1">
                <Link href={`${PUBLIC_ROUTES.AUTH}?tab=signup`} onClick={handleCTAClick}>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#C5A059] to-[#D6B879] text-[#1B3B34] hover:opacity-90 shadow-lg shadow-[#C5A059]/20 group whitespace-nowrap font-semibold"
                  >
                    Testar Grátis
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </motion.div>

      )
      }
    </AnimatePresence >
  );
}
