import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrowthAreasProps {
  strengths: string[];
  growthAreas: string[];
  className?: string;
}

export function GrowthAreas({ strengths, growthAreas, className }: GrowthAreasProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {/* Strengths */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
            <TrendingUp className="h-5 w-5" />
            Suas Potências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {strengths.length > 0 ? (
            strengths.map((strength, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{strength}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 20 + 80)}%
                  </span>
                </div>
                <Progress 
                  value={Math.floor(Math.random() * 20 + 80)} 
                  className="h-1.5 bg-green-100 dark:bg-green-900/30"
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete o quiz para descobrir suas potências
            </p>
          )}
        </CardContent>
      </Card>

      {/* Growth Areas */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-5 w-5" />
            Áreas de Evolução
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {growthAreas.length > 0 ? (
            growthAreas.map((area, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{area}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 30 + 30)}%
                  </span>
                </div>
                <Progress 
                  value={Math.floor(Math.random() * 30 + 30)} 
                  className="h-1.5 bg-amber-100 dark:bg-amber-900/30"
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete o quiz para identificar áreas de melhoria
            </p>
          )}

          {growthAreas.length > 0 && (
            <div className="pt-3 border-t border-amber-200 dark:border-amber-800">
              <p className="text-xs text-muted-foreground italic">
                💡 Dica: Foque em uma área por vez para resultados consistentes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
