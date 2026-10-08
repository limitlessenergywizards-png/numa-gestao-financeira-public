/**
 * Page Skeletons - Granular loading states for faster perceived load
 * 
 * These skeletons match the actual page layouts for minimal CLS.
 */

import { memo } from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// ============================================
// Base Skeleton Components
// ============================================

export const CardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn('rounded-xl border bg-card p-6 space-y-3', className)}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-1/4" />
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

export const MetricCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn('rounded-xl border bg-card p-6', className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  </div>
));
MetricCardSkeleton.displayName = 'MetricCardSkeleton';

export const ChartSkeleton = memo(({ className, height = 300 }: { className?: string; height?: number }) => (
  <div className={cn('rounded-xl border bg-card p-6', className)}>
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-5 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <Skeleton className="w-full rounded-lg" style={{ height }} />
  </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

export const TableRowSkeleton = memo(() => (
  <div className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
    <Skeleton className="h-4 w-4 rounded" />
    <Skeleton className="h-4 flex-1 max-w-[200px]" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="h-4 w-8" />
  </div>
));
TableRowSkeleton.displayName = 'TableRowSkeleton';

export const TableSkeleton = memo(({ rows = 5, className }: { rows?: number; className?: string }) => (
  <div className={cn('rounded-xl border bg-card', className)}>
    {/* Header */}
    <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-8" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} />
    ))}
  </div>
));
TableSkeleton.displayName = 'TableSkeleton';

// ============================================
// Page-specific Skeletons
// ============================================

export const DashboardSkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>

    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton height={280} />
      <ChartSkeleton height={280} />
    </div>

    {/* Table */}
    <TableSkeleton rows={5} />
  </div>
));
DashboardSkeleton.displayName = 'DashboardSkeleton';

export const TransactionsSkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Summary cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>

    {/* Table */}
    <TableSkeleton rows={10} />
  </div>
));
TransactionsSkeleton.displayName = 'TransactionsSkeleton';

export const ReceivablesSkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-36" />
    </div>

    {/* Summary cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-40" />
    </div>

    {/* Table */}
    <TableSkeleton rows={8} />
  </div>
));
ReceivablesSkeleton.displayName = 'ReceivablesSkeleton';

export const CashFlowSkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* View tabs */}
    <Skeleton className="h-10 w-72" />

    {/* KPI row */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>

    {/* Main chart */}
    <ChartSkeleton height={400} />
  </div>
));
CashFlowSkeleton.displayName = 'CashFlowSkeleton';

export const DRESkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Period selector */}
    <div className="flex gap-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-40" />
    </div>

    {/* Gauges */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-32 mx-auto mb-4" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <Skeleton className="h-6 w-20 mx-auto mt-4" />
      </div>
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-32 mx-auto mb-4" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <Skeleton className="h-6 w-20 mx-auto mt-4" />
      </div>
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-32 mx-auto mb-4" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <Skeleton className="h-6 w-20 mx-auto mt-4" />
      </div>
    </div>

    {/* DRE Table */}
    <TableSkeleton rows={12} />
  </div>
));
DRESkeleton.displayName = 'DRESkeleton';

export const CustomersSkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-36" />
    </div>

    {/* Search and filters */}
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Table */}
    <TableSkeleton rows={10} />
  </div>
));
CustomersSkeleton.displayName = 'CustomersSkeleton';

// Export a general-purpose skeleton based on page type
export const PageSkeleton = memo(({ type }: { type: 'dashboard' | 'transactions' | 'receivables' | 'cashflow' | 'dre' | 'customers' | 'default' }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'transactions':
      return <TransactionsSkeleton />;
    case 'receivables':
      return <ReceivablesSkeleton />;
    case 'cashflow':
      return <CashFlowSkeleton />;
    case 'dre':
      return <DRESkeleton />;
    case 'customers':
      return <CustomersSkeleton />;
    default:
      return <DashboardSkeleton />;
  }
});
PageSkeleton.displayName = 'PageSkeleton';
