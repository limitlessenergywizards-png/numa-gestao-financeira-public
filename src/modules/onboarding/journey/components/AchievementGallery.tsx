'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Achievement } from '@/modules/onboarding/services/achievementDefinitions';
import { Lock, Sparkles, Share2 } from 'lucide-react';
import { ShareAchievementDialog } from './ShareAchievementDialog';

interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
}

interface AchievementGalleryProps {
  achievements: AchievementWithStatus[];
  recentlyUnlocked: Achievement[];
  className?: string;
}

export function AchievementGallery({
  achievements,
  recentlyUnlocked,
  className
}: AchievementGalleryProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const handleShare = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShareOpen(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discipline': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'growth': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'consistency': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'mastery': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'special': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'discipline': return 'Disciplina';
      case 'growth': return 'Crescimento';
      case 'consistency': return 'Consistência';
      case 'mastery': return 'Maestria';
      case 'special': return 'Especial';
      default: return category;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🏆 Conquistas
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount} / {achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Recently Unlocked */}
        {recentlyUnlocked.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Recém Desbloqueadas
            </h4>
            <div className="flex gap-2 flex-wrap">
              {recentlyUnlocked.slice(0, 3).map(achievement => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 animate-pulse"
                >
                  <span className="text-xl">{achievement.icon}</span>
                  <span className="text-sm font-medium">{achievement.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Achievements */}
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={cn(
                  "relative p-3 rounded-lg border text-center transition-[transform,box-shadow,background-color] group",
                  achievement.unlocked
                    ? "bg-card hover:bg-accent cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5"
                    : "bg-muted/30 opacity-60"
                )}
              >
                {/* Lock overlay for locked achievements */}
                {!achievement.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                {/* Share button for unlocked achievements */}
                {achievement.unlocked && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(achievement);
                    }}
                    aria-label="Compartilhar conquista"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                )}

                <div className={cn(
                  "text-3xl mb-2",
                  !achievement.unlocked && "grayscale"
                )}>
                  {achievement.icon}
                </div>
                
                <h5 className="text-xs font-medium truncate">
                  {achievement.name}
                </h5>
                
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "mt-2 text-[10px]",
                    getCategoryColor(achievement.category)
                  )}
                >
                  {getCategoryLabel(achievement.category)}
                </Badge>

                {achievement.unlocked && achievement.xpReward > 0 && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    +{achievement.xpReward} XP
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Share Dialog */}
      <ShareAchievementDialog
        achievement={selectedAchievement}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </Card>
  );
}
