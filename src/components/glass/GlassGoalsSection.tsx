import { memo } from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  label: string;
  current: number;
  target: string;
  color: string;
}

interface GlassGoalsSectionProps {
  goals?: Goal[];
  className?: string;
}

const defaultGoals: Goal[] = [
  { id: "1", label: "Meta Receita", current: 60, target: "R$ 100k", color: "#C5A059" },
  { id: "2", label: "Meta Economia", current: 89, target: "R$ 50k", color: "#10B981" },
];

export const GlassGoalsSection = memo(function GlassGoalsSection({
  goals = defaultGoals,
  className,
}: GlassGoalsSectionProps) {
  // SVG circle calculations
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <GlassCard variant="default" padding="md" className={className}>
      <h4 className="font-semibold text-foreground mb-4">Suas Metas</h4>

      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => {
          const strokeDashoffset =
            circumference - (goal.current / 100) * circumference;

          return (
            <div
              key={goal.id}
              className="flex flex-col items-center text-center"
            >
              {/* Circular Progress */}
              <div className="relative mb-2">
                <svg
                  width={size}
                  height={size}
                  className="transform -rotate-90"
                >
                  {/* Track */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="hsla(168 30% 20% / 0.3)"
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={goal.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-1000 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 6px ${goal.color}50)`,
                    }}
                  />
                </svg>

                {/* Percentage in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{ color: goal.color }}
                  >
                    {goal.current}%
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-foreground">{goal.label}</p>
              <p className="text-xs text-muted-foreground">{goal.target}</p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
});

GlassGoalsSection.displayName = 'GlassGoalsSection';
