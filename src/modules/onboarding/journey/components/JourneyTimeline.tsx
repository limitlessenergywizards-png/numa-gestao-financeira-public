'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  narrative: string | null;
  icon: string | null;
  xp_earned: number;
  unlocked_at: string;
}

interface JourneyTimelineProps {
  className?: string;
  limit?: number;
}

export function JourneyTimeline({ className, limit = 10 }: JourneyTimelineProps) {
  const { user } = useAuth();
  const { currentCompany: selectedCompany } = useCompany();
  const { t, language } = useLanguage();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const getLocale = () => {
    switch (language) {
      case 'en-US': return enUS;
      case 'es-ES': return es;
      default: return ptBR;
    }
  };

  useEffect(() => {
    async function fetchMilestones() {
      if (!user?.id || !selectedCompany?.id) return;

      try {
        const { data, error } = await supabase
          .from('journey_milestones')
          .select('id, user_id, company_id, milestone_type, title, description, narrative, icon, xp_earned, unlocked_at')
          .eq('user_id', user.id)
          .eq('company_id', selectedCompany.id)
          .order('unlocked_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setMilestones(data || []);
      } catch (err) {
        console.error('Error fetching milestones:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMilestones();
  }, [user?.id, selectedCompany?.id, limit]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-purple-500';
      case 'level_up': return 'bg-amber-500';
      case 'challenge': return 'bg-blue-500';
      case 'insight': return 'bg-green-500';
      case 'quiz_complete': return 'bg-pink-500';
      case 'mission_complete': return 'bg-cyan-500';
      default: return 'bg-primary';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      achievement: { label: '🏆 Conquista', variant: 'default' },
      level_up: { label: '⬆️ Level Up', variant: 'secondary' },
      challenge: { label: '💪 Desafio', variant: 'outline' },
      insight: { label: '💡 Insight', variant: 'outline' },
      quiz_complete: { label: '🎯 Quiz', variant: 'secondary' },
      mission_complete: { label: '✅ Missão', variant: 'outline' }
    };
    return badges[type] || { label: '✨ Marco', variant: 'outline' as const };
  };

  const getTypeIcon = (type: string, icon: string | null) => {
    if (icon) return icon;
    switch (type) {
      case 'achievement': return '🏆';
      case 'level_up': return '⬆️';
      case 'challenge': return '💪';
      case 'insight': return '💡';
      case 'quiz_complete': return '🎯';
      case 'mission_complete': return '✅';
      default: return '✨';
    }
  };

  const groupMilestones = (items: Milestone[]) => {
    const groups: { label: string; items: Milestone[] }[] = [];
    const today: Milestone[] = [];
    const thisWeek: Milestone[] = [];
    const thisMonth: Milestone[] = [];
    const older: Milestone[] = [];

    items.forEach(item => {
      const date = new Date(item.unlocked_at);
      if (isToday(date)) {
        today.push(item);
      } else if (isThisWeek(date)) {
        thisWeek.push(item);
      } else if (isThisMonth(date)) {
        thisMonth.push(item);
      } else {
        older.push(item);
      }
    });

    if (today.length > 0) groups.push({ label: language === 'en-US' ? 'Today' : 'Hoje', items: today });
    if (thisWeek.length > 0) groups.push({ label: language === 'en-US' ? 'This Week' : 'Esta Semana', items: thisWeek });
    if (thisMonth.length > 0) groups.push({ label: language === 'en-US' ? 'This Month' : 'Este Mês', items: thisMonth });
    if (older.length > 0) groups.push({ label: language === 'en-US' ? 'Earlier' : 'Anteriores', items: older });

    return groups;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">📜 {t('journey.timeline')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">📜 {t('journey.timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-sm">{t('journey.yourJourney')}</p>
            <p className="text-xs mt-1">{t('journey.completeMissions')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedMilestones = groupMilestones(milestones);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📜 {t('journey.timeline')}
          <Badge variant="secondary" className="ml-2 text-xs">
            {milestones.length} {milestones.length === 1 ? 'marco' : 'marcos'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <AnimatePresence>
              {groupedMilestones.map((group, groupIndex) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {group.label}
                  </h4>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-4">
                      {group.items.map((milestone, index) => {
                        const badgeInfo = getTypeBadge(milestone.milestone_type);
                        
                        return (
                          <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                            className="relative pl-10"
                          >
                            {/* Timeline dot with icon */}
                            <div className={cn(
                              "absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm",
                              getTypeColor(milestone.milestone_type)
                            )}>
                              <span className="text-[10px]">
                                {getTypeIcon(milestone.milestone_type, milestone.icon)}
                              </span>
                            </div>

                            <div className="space-y-1 pb-2">
                              <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-medium text-sm">
                                  {milestone.title}
                                </h4>
                                <Badge variant={badgeInfo.variant} className="text-[10px] h-5">
                                  {badgeInfo.label}
                                </Badge>
                                {milestone.xp_earned > 0 && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    +{milestone.xp_earned} XP
                                  </span>
                                )}
                              </div>

                              {milestone.narrative ? (
                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                  "{milestone.narrative}"
                                </p>
                              ) : milestone.description && (
                                <p className="text-sm text-muted-foreground">
                                  {milestone.description}
                                </p>
                              )}

                              <p className="text-xs text-muted-foreground/60">
                                {formatDistanceToNow(new Date(milestone.unlocked_at), {
                                  addSuffix: true,
                                  locale: getLocale()
                                })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
