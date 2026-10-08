import { cn } from '@/lib/utils';
import { ARCHETYPES, ArchetypeInfo } from '@/modules/onboarding/services/personalityAnalyzer';
import { Card, CardContent } from '@/components/ui/card';
import { LevelProgress } from './LevelProgress';

interface ArchetypeCardProps {
  archetype: string | null;
  level: number;
  title: string;
  totalXP: number;
  progress: number;
  nextLevelXP: number;
  className?: string;
}

export function ArchetypeCard({
  archetype,
  level,
  title,
  totalXP,
  progress,
  nextLevelXP,
  className
}: ArchetypeCardProps) {
  const archetypeInfo = archetype ? ARCHETYPES[archetype] : null;

  if (!archetypeInfo) {
    return (
      <Card className={cn("bg-gradient-to-br from-muted/50 to-muted border-dashed", className)}>
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4 opacity-50">❓</div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            Descubra seu Arquétipo
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Complete o quiz para revelar sua personalidade financeira
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-0",
      "bg-gradient-to-br",
      archetypeInfo.gradient,
      className
    )}>
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="relative p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-5xl mb-3 drop-shadow-lg">
              {archetypeInfo.icon}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {archetypeInfo.name}
            </h2>
            <p className="text-white/80 text-sm mt-1 italic">
              "{archetypeInfo.phrase}"
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold">{level}</div>
            <div className="text-xs text-white/70 uppercase tracking-wider">
              Nível
            </div>
          </div>
        </div>

        <p className="text-white/90 text-sm leading-relaxed mb-6">
          {archetypeInfo.description}
        </p>

        <LevelProgress
          level={level}
          title={title}
          totalXP={totalXP}
          progress={progress}
          nextLevelXP={nextLevelXP}
          variant="light"
        />
      </CardContent>
    </Card>
  );
}
