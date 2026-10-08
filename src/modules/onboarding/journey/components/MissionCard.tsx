'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MissionCardProps {
  id: string;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  rewardXP: number;
  status: string;
  expiresAt: string | null;
  onComplete?: (id: string) => void;
  className?: string;
}

export function MissionCard({
  id,
  title,
  description,
  targetValue,
  currentValue,
  rewardXP,
  status,
  expiresAt,
  onComplete,
  className
}: MissionCardProps) {
  const progress = Math.min((currentValue / targetValue) * 100, 100);
  const isCompleted = status === 'completed' || currentValue >= targetValue;

  const getMissionIcon = (title: string) => {
    if (title.includes('Transaç')) return '📝';
    if (title.includes('Recebív')) return '💰';
    if (title.includes('Pagament')) return '💸';
    if (title.includes('Fluxo')) return '📊';
    if (title.includes('DRE')) return '📈';
    if (title.includes('Relatório')) return '📋';
    return '🎯';
  };

  return (
    <Card className={cn(
      "transition-[border-color,box-shadow,background-color] duration-200",
      isCompleted 
        ? "bg-green-500/10 border-green-500/30" 
        : "hover:border-primary/50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {isCompleted ? '✅' : getMissionIcon(title)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={cn(
                "font-medium truncate",
                isCompleted && "text-green-600 dark:text-green-400"
              )}>
                {title}
              </h4>
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 shrink-0">
                <Sparkles className="h-3 w-3" />
                <span>+{rewardXP} XP</span>
              </div>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {currentValue} / {targetValue}
                </span>
                {expiresAt && !isCompleted && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(expiresAt), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </span>
                )}
              </div>
              
              <Progress 
                value={progress} 
                className={cn(
                  "h-1.5",
                  isCompleted && "bg-green-100 dark:bg-green-900/30"
                )}
              />
            </div>

            {isCompleted && !status.includes('completed') && onComplete && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-100"
                onClick={() => onComplete(id)}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resgatar Recompensa
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
