import { memo } from "react";

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface GlassTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatValue?: (value: number) => string;
}

export const GlassTooltip = memo(function GlassTooltip({
  active,
  payload,
  label,
  formatValue = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
}: GlassTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="glass-premium p-3 min-w-[140px] animate-fade-in">
      <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
