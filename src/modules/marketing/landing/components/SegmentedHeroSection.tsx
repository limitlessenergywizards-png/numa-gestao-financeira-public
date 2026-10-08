'use client';

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import type { MockupLabels } from "@/data/landingVariants";

interface SegmentedHeroSectionProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaSecondaryText: string;
  mockupLabels: MockupLabels;
}

export const SegmentedHeroSection = memo(function SegmentedHeroSection({
  headline,
  subheadline,
  ctaText,
  ctaSecondaryText,
  mockupLabels,
}: SegmentedHeroSectionProps) {
  const router = useRouter();

  const handleCTAClick = () => {
    router.push(`${PUBLIC_ROUTES.AUTH}?tab=signup`);
  };

  const handleDemoClick = () => {
    const pricingSection = document.getElementById("pricing");
    pricingSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6 text-foreground">
              {headline}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              {subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={handleCTAClick}
                className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold px-8 py-6 text-lg shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 transition-[background-color,box-shadow]"
              >
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleDemoClick}
                className="border-2 px-8 py-6 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                {ctaSecondaryText}
              </Button>
            </div>

            {/* Social Proof Mini */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand/60 border-2 border-background flex items-center justify-center text-xs font-bold text-brand-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">+500</span> empresas já usam
              </p>
            </motion.div>
          </motion.div>

          {/* Right: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl p-6 overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

              {/* Mock Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Dashboard Numa</span>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                {[mockupLabels.kpi1, mockupLabels.kpi2, mockupLabels.kpi3].map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="bg-background/60 backdrop-blur rounded-xl p-4 border border-border/30"
                  >
                    <p className="text-xs text-muted-foreground mb-1 truncate">{kpi.label}</p>
                    <p className="text-lg font-bold text-foreground truncate">{kpi.value}</p>
                    <div className={`flex items-center gap-1 mt-1 ${kpi.trend.startsWith('+') ? 'text-success' :
                        kpi.trend.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                      {kpi.trend.startsWith('+') ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : kpi.trend.startsWith('-') ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      <span className="text-xs font-medium">{kpi.trend}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Mock Chart */}
              <div className="bg-background/60 backdrop-blur rounded-xl p-4 border border-border/30 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Fluxo de Caixa</span>
                  <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
                </div>
                <div className="flex items-end gap-1 h-24">
                  {[40, 65, 45, 80, 55, 70, 60, 85, 75, 90, 70, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
                      className={`flex-1 rounded-t ${i === 11 ? 'bg-brand' : 'bg-brand/30'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

SegmentedHeroSection.displayName = "SegmentedHeroSection";