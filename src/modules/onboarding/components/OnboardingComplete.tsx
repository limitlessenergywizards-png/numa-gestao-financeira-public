'use client';

import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  ArrowRight,
  Trophy,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCelebration } from "@/hooks/useCelebration";
import { useEffect } from "react";
import { MAIN_ROUTES } from "@/lib/routes";

interface OnboardingCompleteProps {
  companyName?: string;
  onGoToDashboard?: () => void;
}

export const OnboardingComplete = memo(function OnboardingComplete({
  companyName,
  onGoToDashboard
}: OnboardingCompleteProps) {
  const router = useRouter();
  const { trigger, isActive, particles } = useCelebration({ particleCount: 30 });

  useEffect(() => {
    // Trigger celebration on mount
    trigger("confetti", { x: 50, y: 40 });
  }, [trigger]);

  const handleGoToDashboard = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else {
      router.replace(MAIN_ROUTES.HOME);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative text-center py-8"
    >
      {/* Celebration particles */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: "50%",
                y: "40%",
                scale: 0,
                rotate: 0
              }}
              animate={{
                x: `${particle.x}%`,
                y: `${particle.y}%`,
                scale: particle.scale,
                rotate: particle.rotation,
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: particle.color }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
          className="text-6xl mb-6"
        >
          🎉
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Parabéns!</h2>
        <p className="text-muted-foreground mb-2">
          {companyName ? (
            <>A <span className="font-medium text-foreground">{companyName}</span> está configurada!</>
          ) : (
            "Sua empresa está configurada e pronta para uso."
          )}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Seu Numa está pronto para te ajudar a crescer.
        </p>

        {/* XP Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20 mb-8"
        >
          <Trophy className="w-5 h-5 text-brand" />
          <span className="font-medium text-brand">
            +50 XP de Guardião Financeiro
          </span>
          <Sparkles className="w-4 h-4 text-brand animate-pulse" />
        </motion.div>

        {/* CTA Button */}
        <div className="space-y-3">
          <Button
            size="lg"
            onClick={handleGoToDashboard}
            className="gap-2 px-8"
          >
            Ir para o Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Redirecionando automaticamente em instantes...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
});

OnboardingComplete.displayName = "OnboardingComplete";