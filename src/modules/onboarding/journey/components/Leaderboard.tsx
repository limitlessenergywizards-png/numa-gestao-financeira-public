import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  user_id: string;
  profile_name?: string;
  current_value: number;
  rank: number;
  completed_at: string | null;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  metric?: string;
  className?: string;
}

export function Leaderboard({ entries, metric = 'pontos', className }: LeaderboardProps) {
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default: return '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum participante ainda
          </p>
        ) : (
          entries.map((entry, index) => {
            const isCurrentUser = entry.user_id === user?.id;
            const initials = entry.profile_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "animate-fade-in",
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  getRankStyle(entry.rank),
                  isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                {/* Rank */}
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn(
                    "text-xs font-medium",
                    entry.rank <= 3 && "bg-gradient-to-br from-primary/20 to-primary/40"
                  )}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isCurrentUser && "text-primary"
                  )}>
                    {entry.profile_name || 'Anônimo'}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground ml-2">(você)</span>
                    )}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className="font-bold">{entry.current_value}</span>
                  <span className="text-xs text-muted-foreground ml-1">{metric}</span>
                </div>

                {/* Completed badge */}
                {entry.completed_at && (
                  <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-600">
                    ✓
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
