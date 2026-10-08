'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialPersonality } from '@/modules/onboarding/hooks/useFinancialPersonality';
import { useJourneyMissions } from '@/modules/onboarding/journey/hooks/useJourneyMissions';
import { useAchievements } from '@/modules/onboarding/journey/hooks/useAchievements';
import { useStreak } from '@/modules/onboarding/journey/hooks/useStreak';
import { useAchievementNotification } from '@/contexts/AchievementNotificationContext';
import {
  ArchetypeCard,
  ArchetypeQuiz,
  PowersRadar,
  GrowthAreas,
  MissionCard,
  JourneyTimeline,
  FinancialMirror,
  AchievementGallery,
  StreakCounter,
  ProgressDashboard,
  ChallengesSection
} from '../components';
import { Sparkles, Target, Trophy, BookOpen, RefreshCw, TrendingUp, Flag } from 'lucide-react';
import { toast } from 'sonner';

export default function MyJourney() {
  const [showQuiz, setShowQuiz] = useState(false);

  const {
    personality,
    userProgress,
    loading: personalityLoading,
    saveQuizResults,
    addXP,
    hasCompletedQuiz,
    refetch: refetchPersonality
  } = useFinancialPersonality();

  const {
    missions,
    loading: missionsLoading,
    completeMission,
    refetch: refetchMissions
  } = useJourneyMissions();

  const {
    allAchievements,
    recentlyUnlocked,
    loading: achievementsLoading,
    unlockedCount,
    totalCount
  } = useAchievements();

  const {
    currentStreak,
    longestStreak,
    todayLogged,
    logActivity,
  } = useStreak();

  const { showAchievementToast, showStreakToast } = useAchievementNotification();

  // Log activity on page load
  useEffect(() => {
    const checkStreak = async () => {
      const result = await logActivity();
      if (result.streakUpdated && result.newStreak > 1) {
        showStreakToast(result.newStreak, result.bonus > 0 ? result.bonus : undefined);
      }
    };
    if (hasCompletedQuiz) {
      checkStreak();
    }
  }, [hasCompletedQuiz, logActivity, showStreakToast]);

  const handleQuizComplete = async (
    archetypeId: string,
    scores: Record<string, number>,
    answers: { questionId: string; optionIndex: number }[]
  ) => {
    try {
      await saveQuizResults(archetypeId, scores, answers);
      setShowQuiz(false);
      toast.success('Arquétipo revelado! Sua jornada começou.');
      refetchPersonality();
    } catch (err) {
      toast.error('Erro ao salvar resultados do quiz');
    }
  };

  const handleMissionComplete = async (missionId: string) => {
    const xp = await completeMission(missionId);
    if (xp) {
      await addXP(xp, 'Missão completada');
      toast.success(`Missão completada! +${xp} XP`);
      refetchMissions();
      refetchPersonality();
    }
  };

  if (personalityLoading) {
    return (
      <AppLayout>
        <PageHeader
          title="Minha Jornada"
          description="Carregando sua personalidade financeira..."
        />
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[280px]" />
            <Skeleton className="h-[280px]" />
          </div>
          <Skeleton className="h-[200px]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Minha Jornada"
        description="Descubra sua personalidade financeira e evolua como Guardião"
        actions={
          hasCompletedQuiz ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuiz(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refazer Quiz
            </Button>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        {/* Intro card for new users */}
        {!hasCompletedQuiz && (
          <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 border-violet-500/30">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h2 className="text-2xl font-bold mb-2">
                Bem-vindo à sua Jornada Financeira
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                Descubra quem você é como gestor financeiro. Através de um breve quiz,
                revelaremos seu arquétipo único, suas potências naturais e áreas de evolução.
              </p>
              <Button
                size="lg"
                onClick={() => setShowQuiz(true)}
                className="gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Iniciar Descoberta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main content for users who completed quiz */}
        {hasCompletedQuiz && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-[600px]">
              <TabsTrigger value="overview" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Progresso</span>
              </TabsTrigger>
              <TabsTrigger value="challenges" className="gap-2">
                <Flag className="h-4 w-4" />
                <span className="hidden sm:inline">Desafios</span>
              </TabsTrigger>
              <TabsTrigger value="missions" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Missões</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Conquistas</span>
              </TabsTrigger>
              <TabsTrigger value="journey" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">História</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Streak Counter */}
              <div className="animate-fade-in">
                <StreakCounter
                  currentStreak={currentStreak}
                  longestStreak={longestStreak}
                  todayLogged={todayLogged}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                <ArchetypeCard
                  archetype={personality?.archetype || null}
                  level={userProgress?.level || 1}
                  title={userProgress?.title || 'Aprendiz Financeiro'}
                  totalXP={userProgress?.totalXP || 0}
                  progress={userProgress?.progress || 0}
                  nextLevelXP={userProgress?.nextLevelXP || 100}
                />

                <PowersRadar
                  scores={personality?.archetype_score || {}}
                />
              </div>

              <GrowthAreas
                strengths={personality?.strengths || []}
                growthAreas={personality?.growth_areas || []}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <FinancialMirror archetype={personality?.archetype || null} />

                {/* Quick missions preview */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Missões Ativas
                    </h3>
                    {missionsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </div>
                    ) : missions.length > 0 ? (
                      <div className="space-y-3">
                        {missions.slice(0, 3).map(mission => (
                          <MissionCard
                            key={mission.id}
                            id={mission.id}
                            title={mission.title}
                            description={mission.description}
                            targetValue={mission.target_value}
                            currentValue={mission.current_value}
                            rewardXP={mission.reward_xp}
                            status={mission.status}
                            expiresAt={mission.expires_at}
                            onComplete={handleMissionComplete}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma missão ativa no momento
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress">
              <ProgressDashboard />
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges">
              <ChallengesSection />
            </TabsContent>

            {/* Missions Tab */}
            <TabsContent value="missions" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {missionsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))
                ) : missions.length > 0 ? (
                  missions.map(mission => (
                    <MissionCard
                      key={mission.id}
                      id={mission.id}
                      title={mission.title}
                      description={mission.description}
                      targetValue={mission.target_value}
                      currentValue={mission.current_value}
                      rewardXP={mission.reward_xp}
                      status={mission.status}
                      expiresAt={mission.expires_at}
                      onComplete={handleMissionComplete}
                    />
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center">
                      <div className="text-4xl mb-3">🎯</div>
                      <p className="text-muted-foreground">
                        Novas missões serão geradas em breve!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <AchievementGallery
                achievements={allAchievements}
                recentlyUnlocked={recentlyUnlocked}
              />
            </TabsContent>

            {/* Journey Tab */}
            <TabsContent value="journey">
              <JourneyTimeline limit={20} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Quiz Dialog */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Descubra seu Arquétipo Financeiro
            </DialogTitle>
          </DialogHeader>
          <ArchetypeQuiz
            onComplete={handleQuizComplete}
            onCancel={() => setShowQuiz(false)}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
