import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/formatters";

interface MarginGaugeProps {
  value: number;
  label: string;
  description?: string;
  maxValue?: number;
  thresholds?: {
    danger: number;
    warning: number;
    success: number;
  };
}

export function MarginGauge({
  value,
  label,
  description,
  maxValue = 100,
  thresholds = { danger: 10, warning: 20, success: 30 },
}: MarginGaugeProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

  const getColor = () => {
    if (value >= thresholds.success) return "text-success";
    if (value >= thresholds.warning) return "text-warning";
    return "text-destructive";
  };

  const getGradient = () => {
    if (value >= thresholds.success) return "from-success/20 to-success/5";
    if (value >= thresholds.warning) return "from-warning/20 to-warning/5";
    return "from-destructive/20 to-destructive/5";
  };

  const getArcColor = () => {
    if (value >= thresholds.success) return "stroke-success";
    if (value >= thresholds.warning) return "stroke-warning";
    return "stroke-destructive";
  };

  // SVG arc calculations for semi-circle gauge
  const radius = 70;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={cn("overflow-hidden bg-gradient-to-br", getGradient())}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4">
        {/* Semi-circle gauge */}
        <div className="relative w-40 h-24">
          <svg
            width="160"
            height="96"
            viewBox="0 0 160 96"
            className="transform -rotate-0"
          >
            {/* Background arc */}
            <path
              d="M 10 90 A 70 70 0 0 1 150 90"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className="stroke-muted/30"
            />
            {/* Value arc */}
            <path
              d="M 10 90 A 70 70 0 0 1 150 90"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className={cn("transition-[stroke-dashoffset] duration-700", getArcColor())}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className={cn("text-3xl font-bold", getColor())}>
              {formatPct(value)}
            </span>
          </div>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {description}
          </p>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">&lt;{thresholds.danger}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">{thresholds.danger}-{thresholds.warning}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">&gt;{thresholds.success}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
