import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { STREAK_REWARDS } from '@/modules/onboarding/journey/hooks/useStreak';
import { Flame, Trophy } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  todayLogged: boolean;
  className?: string;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  todayLogged,
  className,
}: StreakCounterProps) {
  const nextReward = STREAK_REWARDS.find(r => r.days > currentStreak);
  const progressToNext = nextReward
    ? ((currentStreak % (nextReward.days - (STREAK_REWARDS.find(r => r.days <= currentStreak && r.days > (STREAK_REWARDS[STREAK_REWARDS.indexOf(nextReward) - 1]?.days || 0))?.days || 0))) / (nextReward.days - (STREAK_REWARDS[STREAK_REWARDS.indexOf(nextReward) - 1]?.days || 0))) * 100
    : 100;

  const getFlameSize = () => {
    if (currentStreak >= 100) return 'text-6xl';
    if (currentStreak >= 30) return 'text-5xl';
    if (currentStreak >= 7) return 'text-4xl';
    return 'text-3xl';
  };

  const getFlameAnimation = () => {
    if (currentStreak >= 30) {
      return {
        scale: [1, 1.1, 1],
        rotate: [-3, 3, -3],
      };
    }
    if (currentStreak >= 7) {
      return {
        scale: [1, 1.05, 1],
      };
    }
    return {};
  };

  return (
    <Card className={cn(
      "overflow-hidden",
      currentStreak >= 7 
        ? "bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10 border-orange-500/30"
        : "",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Flame icon */}
          <motion.div
            animate={currentStreak > 0 ? getFlameAnimation() : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'mirror',
            }}
            className={cn(
              "relative",
              getFlameSize()
            )}
          >
            {currentStreak > 0 ? (
              <>
                🔥
                {/* Glow effect for high streaks */}
                {currentStreak >= 30 && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full -z-10"
                  />
                )}
              </>
            ) : (
              <Flame className="h-8 w-8 text-muted-foreground" />
            )}
          </motion.div>

          {/* Streak info */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={currentStreak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold"
              >
                {currentStreak}
              </motion.span>
              <span className="text-sm text-muted-foreground">
                {currentStreak === 1 ? 'dia' : 'dias'} seguidos
              </span>
            </div>

            {/* Today status */}
            <div className="flex items-center gap-2 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                todayLogged ? "bg-green-500" : "bg-yellow-500 animate-pulse"
              )} />
              <span className="text-xs text-muted-foreground">
                {todayLogged ? 'Atividade registrada hoje' : 'Faça algo para manter o streak!'}
              </span>
            </div>

            {/* Progress to next reward */}
            {nextReward && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Próximo bônus: {nextReward.label}</span>
                  <span>{nextReward.days - currentStreak} dias</span>
                </div>
                <Progress value={progressToNext} className="h-1.5" />
              </div>
            )}
          </div>

          {/* Longest streak */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-3 w-3" />
              <span className="text-xs">Recorde</span>
            </div>
            <span className="font-semibold">{longestStreak}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
