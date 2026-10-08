'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeeklyChallenges } from '@/modules/onboarding/journey/hooks/useWeeklyChallenges';
import { WeeklyChallengeCard } from './WeeklyChallengeCard';
import { Leaderboard } from './Leaderboard';
import { Flag, Users, Swords, Handshake, Trophy, Sparkles } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  company_id: string;
  profile_name?: string;
  current_value: number;
  rank: number;
  completed_at: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ChallengesSection() {
  const { challenges, loading, joinChallenge, fetchLeaderboard } = useWeeklyChallenges();
  const [filter, setFilter] = useState<string>('all');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'all') return true;
    return challenge.challenge_type === filter;
  });

  const handleViewLeaderboard = async (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setLeaderboardOpen(true);
    setLoadingLeaderboard(true);
    try {
      const entries = await fetchLeaderboard(challengeId);
      setLeaderboardEntries(entries);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleJoin = async (challengeId: string): Promise<void> => {
    await joinChallenge(challengeId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Desafios da Semana</h2>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {challenges.filter(c => c.joined).length} participando
        </Badge>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-2">
            <Flag className="h-4 w-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="competitive" className="gap-2">
            <Swords className="h-4 w-4" />
            Competitivo
          </TabsTrigger>
          <TabsTrigger value="collaborative" className="gap-2">
            <Handshake className="h-4 w-4" />
            Colaborativo
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Challenges Grid */}
      {filteredChallenges.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-medium mb-2">Nenhum desafio ativo</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all'
                ? 'Novos desafios serão adicionados em breve!'
                : `Nenhum desafio ${filter === 'individual' ? 'individual' : filter === 'competitive' ? 'competitivo' : 'colaborativo'} ativo no momento.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {filteredChallenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <WeeklyChallengeCard
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  challengeType={challenge.challenge_type}
                  targetValue={challenge.target_value}
                  currentValue={challenge.current_value || 0}
                  rewardXP={challenge.reward_xp}
                  rewardBadge={challenge.reward_badge}
                  endsAt={challenge.ends_at}
                  joined={challenge.joined || false}
                  completedAt={challenge.completed_at || null}
                  rank={challenge.rank}
                  onJoin={handleJoin}
                  onViewLeaderboard={handleViewLeaderboard}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Challenge Info */}
      {challenges.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Individual:</strong> Complete sozinho
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Competitivo:</strong> Dispute o ranking
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Colaborativo:</strong> Todos juntos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Dialog */}
      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking do Desafio
            </DialogTitle>
          </DialogHeader>
          {loadingLeaderboard ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (
            <Leaderboard entries={leaderboardEntries} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
