import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface LevelProgressProps {
  level: number;
  title: string;
  totalXP: number;
  progress: number;
  nextLevelXP: number;
  variant?: 'default' | 'light';
  className?: string;
}

export function LevelProgress({
  level,
  title,
  totalXP,
  progress,
  nextLevelXP,
  variant = 'default',
  className
}: LevelProgressProps) {
  const isLight = variant === 'light';

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={cn(
            "h-4 w-4",
            isLight ? "text-yellow-300" : "text-yellow-500"
          )} />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-white" : "text-foreground"
          )}>
            {title}
          </span>
        </div>
        <span className={cn(
          "text-xs",
          isLight ? "text-white/70" : "text-muted-foreground"
        )}>
          {totalXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={progress} 
          className={cn(
            "h-2",
            isLight ? "bg-white/20" : "bg-muted"
          )}
        />
        <div 
          className={cn(
            "absolute inset-0 h-2 rounded-full overflow-hidden",
            isLight ? "bg-gradient-to-r from-yellow-400 to-amber-300" : "bg-gradient-to-r from-primary to-primary/80"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {level < 10 && (
        <p className={cn(
          "text-xs text-center",
          isLight ? "text-white/60" : "text-muted-foreground"
        )}>
          {nextLevelXP - totalXP} XP para o próximo nível
        </p>
      )}
    </div>
  );
}
