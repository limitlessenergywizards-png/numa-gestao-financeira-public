/**
 * MetricCardsGrid - Animated grid layout for metric cards
 * 
 * Provides consistent grid layout with staggered animations.
 * Wraps GradientMetricCard components.
 */

import { memo } from 'react';
import { GradientMetricCard, type GradientMetricCardProps } from './gradient-metric-card';
import { cn } from '@/lib/utils';

// Re-export for convenience
export type { GradientMetricCardProps } from './gradient-metric-card';

export interface MetricCardsGridProps {
  /** Array of card configurations */
  cards: GradientMetricCardProps[];
  /** Enable entrance animations (default: true) */
  animate?: boolean;
  /** Grid columns configuration (default: "grid-cols-2 lg:grid-cols-4") */
  columns?: string;
  /** Gap between cards (default: "gap-4") */
  gap?: string;
  /** Additional CSS classes */
  className?: string;
}

export const MetricCardsGrid = memo(function MetricCardsGrid({
  cards,
  animate = true,
  columns = "grid-cols-2 lg:grid-cols-4",
  gap = "gap-4",
  className,
}: MetricCardsGridProps) {
  return (
    <div className={cn("grid", columns, gap, className)}>
      {cards.map((card, index) => (
        animate ? (
          <div
            key={card.title}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
          >
            <GradientMetricCard {...card} />
          </div>
        ) : (
          <GradientMetricCard key={card.title} {...card} />
        )
      ))}
    </div>
  );
});

MetricCardsGrid.displayName = 'MetricCardsGrid';
