'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERSONALITY_DIMENSIONS } from '@/modules/onboarding/services/personalityAnalyzer';

interface PowersRadarProps {
  scores: Record<string, number>;
  className?: string;
}

export function PowersRadar({ scores, className }: PowersRadarProps) {
  const data = useMemo(() => {
    return PERSONALITY_DIMENSIONS.map(dim => ({
      dimension: dim.name,
      value: scores[dim.id] || 0,
      fullMark: dim.maxScore
    }));
  }, [scores]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          ⚡ Mapa de Potências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                strokeDasharray="3 3"
              />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={{ 
                  fill: 'hsl(var(--muted-foreground))', 
                  fontSize: 11 
                }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar
                name="Sua Pontuação"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.slice(0, 4).map((item) => (
            <div key={item.dimension} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full bg-primary"
                style={{ opacity: item.value / 100 }}
              />
              <span className="text-muted-foreground truncate">
                {item.dimension}: {item.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
