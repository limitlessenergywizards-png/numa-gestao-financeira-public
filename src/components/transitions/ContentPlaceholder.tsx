import { cn } from '@/lib/utils';
import { useAnimation } from '@/contexts/AnimationContext';

interface ContentPlaceholderProps {
  className?: string;
  variant?: 'card' | 'list' | 'table' | 'dashboard' | 'text' | 'custom';
  rows?: number;
}

/**
 * ContentPlaceholder - Premium shimmer skeleton with golden wave
 * 
 * Features:
 * - Animated gradient shimmer effect
 * - Multiple preset variants for common layouts
 * - Brand-aligned golden shimmer color
 * - Respects reduced motion preferences
 */
export const ContentPlaceholder = ({
  className,
  variant = 'card',
  rows = 3,
}: ContentPlaceholderProps) => {
  const { isEnabled, prefersReducedMotion } = useAnimation();

  const renderContent = () => {
    switch (variant) {
      case 'card':
        return <CardPlaceholder />;
      case 'list':
        return <ListPlaceholder rows={rows} />;
      case 'table':
        return <TablePlaceholder rows={rows} />;
      case 'dashboard':
        return <DashboardPlaceholder />;
      case 'text':
        return <TextPlaceholder rows={rows} />;
      default:
        return <CardPlaceholder />;
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {renderContent()}
      {isEnabled && !prefersReducedMotion && <ShimmerOverlay />}
    </div>
  );
};

// Shimmer wave overlay using CSS animation
const ShimmerOverlay = () => (
  <div
    className="absolute inset-0 pointer-events-none animate-shimmer"
    style={{
      background:
        'linear-gradient(90deg, transparent 0%, hsl(var(--brand) / 0.08) 20%, hsl(var(--brand) / 0.15) 50%, hsl(var(--brand) / 0.08) 80%, transparent 100%)',
      backgroundSize: '200% 100%',
    }}
  />
);

// Skeleton block component
const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'rounded-md bg-muted/60',
      className
    )}
  />
);

// Card variant
const CardPlaceholder = () => (
  <div className="space-y-4 p-6 rounded-xl bg-card border border-border/50">
    <div className="flex items-center gap-4">
      <SkeletonBlock className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonBlock className="h-24 w-full" />
    <div className="flex gap-2">
      <SkeletonBlock className="h-8 w-20" />
      <SkeletonBlock className="h-8 w-20" />
    </div>
  </div>
);

// List variant
const ListPlaceholder = ({ rows }: { rows: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50"
      >
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
        <SkeletonBlock className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// Table variant
const TablePlaceholder = ({ rows }: { rows: number }) => (
  <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
    {/* Header */}
    <div className="flex gap-4 p-4 bg-muted/30 border-b border-border/50">
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-4 w-20" />
      <SkeletonBlock className="h-4 w-28 ml-auto" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex gap-4 p-4 border-b border-border/30 last:border-0"
      >
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-4 w-28 ml-auto" />
      </div>
    ))}
  </div>
);

// Dashboard variant
const DashboardPlaceholder = () => (
  <div className="space-y-6">
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-xl bg-card border border-border/50"
        >
          <SkeletonBlock className="h-4 w-20 mb-3" />
          <SkeletonBlock className="h-8 w-28 mb-2" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
    {/* Chart area */}
    <div className="p-6 rounded-xl bg-card border border-border/50">
      <SkeletonBlock className="h-5 w-40 mb-4" />
      <SkeletonBlock className="h-64 w-full rounded-lg" />
    </div>
  </div>
);

// Width class mapping to avoid nested ternaries
const WIDTH_CLASSES: Record<string, string> = {
  '90%': 'w-[90%]',
  '80%': 'w-[80%]',
  '70%': 'w-[70%]',
  '60%': 'w-[60%]',
};

// Text variant
const TextPlaceholder = ({ rows }: { rows: number }) => {
  // Pre-calculate widths to avoid recalculation on re-render
  const widths = Array.from({ length: rows }, (_, i) => 
    i === 0 ? '90%' : i === rows - 1 ? '60%' : `${70 + (i % 3) * 10}%`
  );

  return (
    <div className="space-y-3">
      {widths.map((width, i) => (
        <SkeletonBlock
          key={i}
          className={`h-4 ${WIDTH_CLASSES[width] || 'w-[60%]'}`}
        />
      ))}
    </div>
  );
};

// Inline skeleton for single elements
export const InlineSkeleton = ({
  width = 100,
  height = 20,
  className,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) => {
  const { isEnabled, prefersReducedMotion } = useAnimation();

  return (
    <div
      className={cn('relative overflow-hidden rounded', className)}
      style={{ width, height }}
    >
      <SkeletonBlock className="h-full w-full" />
      {isEnabled && !prefersReducedMotion && <ShimmerOverlay />}
    </div>
  );
};
