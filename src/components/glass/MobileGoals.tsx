import { memo } from "react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  label: string;
  current: number;
  target: string;
  color: string;
}

interface MobileGoalsProps {
  goals?: Goal[];
  className?: string;
}

const defaultGoals: Goal[] = [
  { id: "1", label: "Meta Receita", current: 60, target: "R$ 100k", color: "#C5A059" },
  { id: "2", label: "Meta Economia", current: 89, target: "R$ 50k", color: "#10B981" },
];

export const MobileGoals = memo(function MobileGoals({
  goals = defaultGoals,
  className,
}: MobileGoalsProps) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {goals.map((goal) => {
        const strokeDashoffset =
          circumference - (goal.current / 100) * circumference;

        return (
          <div
            key={goal.id}
            className="glass-subtle p-4 flex flex-col items-center text-center"
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
                    filter: `drop-shadow(0 0 4px ${goal.color}50)`,
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: goal.color }}
                >
                  {goal.current}%
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-foreground">{goal.label}</p>
            <p className="text-[10px] text-muted-foreground">{goal.target}</p>
          </div>
        );
      })}
    </div>
  );
});
