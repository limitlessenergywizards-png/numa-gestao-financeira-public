'use client';

import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { Achievement } from '@/modules/onboarding/services/achievementDefinitions';
import { Sparkles } from 'lucide-react';

// ─── CSS-only Achievement Toasts ───
// Replaced framer-motion (121 KB) with pure CSS animations.
// This context is now safe to load at any level without bloating the bundle.

interface AchievementNotificationContextType {
  showAchievementToast: (achievement: Achievement) => void;
  showStreakToast: (streak: number, bonus?: number) => void;
  showLevelUpToast: (level: number, title: string) => void;
}

const AchievementNotificationContext = createContext<AchievementNotificationContextType | null>(null);

export function useAchievementNotification() {
  const context = useContext(AchievementNotificationContext);
  if (!context) {
    throw new Error('useAchievementNotification must be used within AchievementNotificationProvider');
  }
  return context;
}

interface Props {
  children: ReactNode;
}

export function AchievementNotificationProvider({ children }: Props) {
  const showAchievementToast = useCallback((achievement: Achievement) => {
    toast.custom(
      () => (
        <div
          className="achievement-toast-enter relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white rounded-xl shadow-2xl p-4 min-w-[320px]"
        >
          {/* CSS confetti particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="confetti-particle absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>

          <div className="relative flex items-center gap-4">
            <div className="achievement-icon-enter text-5xl drop-shadow-lg">
              {achievement.icon}
            </div>

            <div className="flex-1">
              <div className="achievement-text-enter flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-100">
                <Sparkles className="h-3 w-3" />
                Conquista Desbloqueada!
              </div>

              <h3 className="achievement-text-enter font-bold text-lg mt-1" style={{ animationDelay: '100ms' }}>
                {achievement.name}
              </h3>

              <p className="achievement-text-enter text-sm text-amber-100 mt-0.5" style={{ animationDelay: '200ms' }}>
                {achievement.description}
              </p>

              <div
                className="achievement-badge-enter inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-white/20 rounded-full text-sm font-semibold"
                style={{ animationDelay: '300ms' }}
              >
                +{achievement.xpReward} XP
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  }, []);

  const showStreakToast = useCallback((streak: number, bonus?: number) => {
    toast.custom(
      () => (
        <div className="achievement-toast-enter bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-2xl p-4 min-w-[280px]">
          <div className="flex items-center gap-4">
            <div className="streak-fire-pulse text-5xl">
              🔥
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-orange-100">
                Streak Mantido!
              </div>
              <div className="font-bold text-2xl mt-1">
                {streak} dias seguidos
              </div>
              {bonus && (
                <div className="text-sm text-orange-100 mt-0.5">
                  Bônus: +{bonus} XP
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      { duration: 4000 }
    );
  }, []);

  const showLevelUpToast = useCallback((level: number, title: string) => {
    toast.custom(
      () => (
        <div className="achievement-toast-enter bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-xl shadow-2xl p-4 min-w-[300px]">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-indigo-400/20 rounded-xl blur-xl" />

          <div className="relative flex items-center gap-4">
            <div className="achievement-icon-enter relative">
              <div className="text-5xl">⬆️</div>
              <div className="level-ring absolute inset-0 border-2 border-dashed border-white/30 rounded-full" />
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-purple-200">
                Level Up!
              </div>
              <div className="font-bold text-3xl mt-1">
                Nível {level}
              </div>
              <div className="text-sm text-purple-200 mt-0.5">
                {title}
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  }, []);

  const value = useMemo(() => ({
    showAchievementToast, showStreakToast, showLevelUpToast,
  }), [showAchievementToast, showStreakToast, showLevelUpToast]);

  return (
    <AchievementNotificationContext.Provider value={value}>
      {children}
    </AchievementNotificationContext.Provider>
  );
}
