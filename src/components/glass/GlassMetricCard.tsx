import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCurrency } from "@/components/ui/animated-currency";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlassMetricCardProps {
  label: string;
  value: number;
  change?: { value: number; type: "increase" | "decrease" };
  icon: LucideIcon;
  accentColor?: "gold" | "success" | "danger" | "info" | "warning";
  formatAs?: "currency" | "percent" | "number";
  currencySymbol?: string;
  suffix?: string;
  compact?: boolean;
  delay?: number;
  tooltip?: string;
  loading?: boolean;
}

/**
 * GlassMetricCard — Numa Brand Identity
 *
 * UX attention strategy (beyond font scaling):
 * 1. COLORED LEFT ACCENT BAR — instant category recognition via peripheral vision
 * 2. ICON with GLOWING RING — draws the eye to the card corner, anchoring attention
 * 3. MICRO-DIVIDER LINE — creates visual separation between label and value,
 *    making the value stand out without needing larger font
 * 4. BOTTOM GRADIENT WASH — subtle ambient color from the bottom edge,
 *    never interfering with text legibility
 * 5. BRAND-ALIGNED BACKGROUNDS — uses --card / --glass-surface tokens
 *    for solid, readable backgrounds in both light and dark modes
 * 6. VALUE TEXT-SHADOW GLOW (dark mode) — colored halo behind the number
 *    creates depth and draws focus to the data point
 */
export const GlassMetricCard = memo(function GlassMetricCard({
  label,
  value,
  change,
  icon: Icon,
  accentColor = "gold",
  formatAs = "currency",
  currencySymbol = "R$",
  suffix,
  compact = false,
  tooltip,
  loading = false,
}: GlassMetricCardProps) {
  /*
   * Design tokens mapped to Numa CSS custom properties.
   * Uses hsl(var(--token)) pattern for consistency with the brand system.
   * Each accent maps to: left bar color, icon treatment, label color, and ambient glow.
   */
  const themes = {
    gold: {
      barColor: "bg-brand",
      labelColor: "text-brand-dark dark:text-brand-light",
      iconWrap: "bg-brand/10 text-brand dark:text-brand-light ring-brand/20 dark:ring-brand/25",
      glowVar: "--brand",
      divider: "bg-brand/40",
      valueShadowCss: "0 0 18px hsl(42 50% 56% / 0.3)",
      changeBadge: "bg-brand/10 text-brand-dark dark:text-brand-light border-brand/20",
      lightGradientClasses: "from-brand/10 to-brand/5 border-brand/20",
      darkGradientClasses: "dark:bg-[#2A3428] dark:border-[#384236]", // Realista / Muted olive pastel
    },
    success: {
      barColor: "bg-success",
      labelColor: "text-success dark:text-success",
      iconWrap: "bg-success/10 text-success ring-success/20 dark:ring-success/25",
      glowVar: "--success",
      divider: "bg-success/40",
      valueShadowCss: "0 0 18px hsl(160 84% 39% / 0.3)",
      changeBadge: "bg-success/10 text-success border-success/20",
      lightGradientClasses: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
      darkGradientClasses: "dark:bg-[#1C3A30] dark:border-[#264D40]", // Otimista / Deep pastel emerald
    },
    danger: {
      barColor: "bg-destructive",
      labelColor: "text-destructive dark:text-destructive",
      iconWrap: "bg-destructive/10 text-destructive ring-destructive/20 dark:ring-destructive/25",
      glowVar: "--destructive",
      divider: "bg-destructive/40",
      valueShadowCss: "0 0 18px hsl(0 84% 60% / 0.3)",
      changeBadge: "bg-destructive/10 text-destructive border-destructive/20",
      lightGradientClasses: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
      darkGradientClasses: "dark:bg-[#3B2C30] dark:border-[#4F3C42]", // Pessimista / Subdued pastel rose
    },
    info: {
      barColor: "bg-info",
      labelColor: "text-info dark:text-info",
      iconWrap: "bg-info/10 text-info ring-info/20 dark:ring-info/25",
      glowVar: "--info",
      divider: "bg-info/40",
      valueShadowCss: "0 0 18px hsl(199 89% 48% / 0.3)",
      changeBadge: "bg-info/10 text-info border-info/20",
      lightGradientClasses: "from-sky-500/10 to-sky-500/5 border-sky-500/20",
      darkGradientClasses: "dark:bg-[#1E3642] dark:border-[#284857]", // Pastel muted blue
    },
    warning: {
      barColor: "bg-warning",
      labelColor: "text-warning dark:text-warning",
      iconWrap: "bg-warning/10 text-warning ring-warning/20 dark:ring-warning/25",
      glowVar: "--warning",
      divider: "bg-warning/40",
      valueShadowCss: "0 0 18px hsl(38 92% 50% / 0.3)",
      changeBadge: "bg-warning/10 text-warning border-warning/20",
      lightGradientClasses: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
      darkGradientClasses: "dark:bg-[#382E1E] dark:border-[#4D3F2A]", // Pastel muted amber/gold
    },
  };

  const t = themes[accentColor];

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm h-[130px]">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", t.barColor)} />
        <div className="p-5 pl-5 flex items-start justify-between h-full">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Value rendering ───
  const valSize = compact ? "xl" : "2xl";
  const valTextClass = compact
    ? "text-xl md:text-2xl font-bold tabular-nums tracking-tight text-foreground"
    : "text-2xl md:text-3xl font-bold tabular-nums tracking-tight text-foreground";

  const renderValue = () => {
    if (formatAs === "currency") {
      return (
        <AnimatedCurrency
          value={value}
          symbol={currencySymbol}
          size={valSize}
          className="text-foreground font-bold"
        />
      );
    }
    if (formatAs === "percent") {
      return (
        <span className={valTextClass}>
          {value.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className={valTextClass}>
        {value.toLocaleString("pt-BR")}
        {suffix && <span className="text-sm font-medium text-muted-foreground ml-1.5">{suffix}</span>}
      </span>
    );
  };

  // ─── Card content ───
  const cardContent = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl transition-[transform,box-shadow] duration-300",
        // Soft warm cream in light mode, dark card in dark mode
        "bg-card border border-border/40",
        "bg-gradient-to-br backdrop-blur-sm",
        t.lightGradientClasses, // For light mode gradient
        "dark:bg-transparent dark:backdrop-blur-sm", // Remove dark bg-gradient wrapper entirely to allow custom flat specific background colors like bg-emerald-950/40
        t.darkGradientClasses, // Uses exact background string
        // Subtle inner depth
        "shadow-sm",
        // Hover lift + glow
        "hover:-translate-y-0.5 hover:shadow-md",
        "dark:hover:shadow-[0_8px_30px_hsl(var(--brand)/0.08)]"
      )}
    >
      {/* ── LEFT ACCENT BAR ── category recognition via peripheral vision */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", t.barColor)} />

      {/* ── BOTTOM GRADIENT WASH ── ambient color, never touches text area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none opacity-60 dark:opacity-40"
        style={{
          background: `linear-gradient(to top, hsl(var(${t.glowVar}) / 0.12), hsl(var(${t.glowVar}) / 0.04) 60%, transparent)`,
        }}
      />

      {/* ── KPI RADIAL ── subtle brand glow in top-right (matches .kpi-card::before) */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-30 dark:opacity-20"
        style={{
          background: `radial-gradient(circle, hsl(var(${t.glowVar}) / 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 p-5 pl-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Label — uses text-caption pattern from brand guide */}
          <p className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.08em] leading-tight whitespace-pre-line",
            t.labelColor
          )}>
            {label}
          </p>

          {/* Micro-divider — thin accent line for visual hierarchy without font scaling */}
          <div className={cn("w-8 h-[2px] rounded-full", t.divider)} />

          {/* Value — max contrast, dark-mode glow */}
          <div
            className="pt-1"
            style={{
              "--value-glow": t.valueShadowCss,
            } as React.CSSProperties}
          >
            <div className="dark:[text-shadow:var(--value-glow)]">
              {renderValue()}
            </div>
          </div>

          {/* Change badge */}
          {change && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              t.changeBadge
            )}>
              <span>{change.type === "increase" ? "↗" : "↘"}</span>
              <span>{change.value}%</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-xl shrink-0 -mt-0.5",
            "ring-2 transition-[transform,box-shadow] duration-300",
            "group-hover:scale-110 group-hover:ring-4",
            t.iconWrap
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );

  // ─── Tooltip wrapper ───
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
});
