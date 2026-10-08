'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Users, Trophy, Sparkles, ChevronRight } from 'lucide-react';

interface WeeklyChallengeCardProps {
  id: string;
  title: string;
  description: string | null;
  challengeType: string;
  targetValue: number;
  currentValue: number;
  rewardXP: number;
  rewardBadge: string | null;
  endsAt: string;
  joined: boolean;
  completedAt: string | null;
  rank?: number;
  onJoin?: (id: string) => Promise<void>;
  onViewLeaderboard?: (id: string) => void;
  className?: string;
}

export function WeeklyChallengeCard({
  id,
  title,
  description,
  challengeType,
  targetValue,
  currentValue,
  rewardXP,
  rewardBadge,
  endsAt,
  joined,
  completedAt,
  rank,
  onJoin,
  onViewLeaderboard,
  className,
}: WeeklyChallengeCardProps) {
  const [joining, setJoining] = useState(false);
  const progress = Math.min((currentValue / targetValue) * 100, 100);
  const isCompleted = !!completedAt;

  const handleJoin = async () => {
    if (!onJoin) return;
    setJoining(true);
    try {
      await onJoin(id);
    } finally {
      setJoining(false);
    }
  };

  const getChallengeIcon = () => {
    switch (challengeType) {
      case 'competitive': return '🏁';
      case 'collaborative': return '🤝';
      default: return '🎯';
    }
  };

  const getChallengeLabel = () => {
    switch (challengeType) {
      case 'competitive': return 'Competitivo';
      case 'collaborative': return 'Colaborativo';
      default: return 'Individual';
    }
  };

  return (
    <div className="transition-transform duration-200 hover:-translate-y-1">
      <Card className={cn(
        "overflow-hidden transition-[border-color,box-shadow]",
        isCompleted
          ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30"
          : joined
            ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30"
            : "hover:border-primary/50",
        className
      )}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getChallengeIcon()}</span>
              <div>
                <h4 className="font-semibold line-clamp-1">{title}</h4>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {getChallengeLabel()}
                </Badge>
              </div>
            </div>

            {/* Rewards */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                <span className="text-sm font-medium">+{rewardXP} XP</span>
              </div>
              {rewardBadge && (
                <span className="text-lg">{rewardBadge}</span>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Progress (if joined) */}
          {joined && (
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Progresso: {currentValue} / {targetValue}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(endsAt), { addSuffix: true, locale: ptBR })}
              </span>
              {rank && rank <= 3 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Trophy className="h-3 w-3" />
                  #{rank}
                </span>
              )}
            </div>

            {/* Action button */}
            {!joined ? (
              <Button
                size="sm"
                onClick={handleJoin}
                disabled={joining}
                className="h-7 text-xs"
              >
                {joining ? 'Entrando...' : 'Participar'}
              </Button>
            ) : isCompleted ? (
              <Badge className="bg-green-500 text-white">
                ✓ Concluído
              </Badge>
            ) : challengeType === 'competitive' && onViewLeaderboard ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewLeaderboard(id)}
                className="h-7 text-xs gap-1"
              >
                <Users className="h-3 w-3" />
                Ranking
                <ChevronRight className="h-3 w-3" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
