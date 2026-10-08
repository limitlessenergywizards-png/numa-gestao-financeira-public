'use client';

/**
 * ForecastAccuracyChart
 *
 * Shows how accurate the forecasts (previsões) were compared to actuals (realizados).
 * Displays: accuracy rate gauge, converted vs missed bar, and confidence breakdown.
 */

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';

interface ForecastStats {
    totalForecasts: number;
    converted: number;
    pending: number;
    expired: number; // overdue and never converted
    accuracyRate: number;
    byType: { type: string; count: number; converted: number }[];
    avgConfidence: number;
}

function useForecastStats(): { stats: ForecastStats; isLoading: boolean } {
    const { currentCompany } = useCompany();
    const companyId = currentCompany?.id;

    const { data, isLoading } = useQuery({
        queryKey: ['forecast-accuracy', companyId],
        queryFn: async () => {
            if (!companyId) return null;

            // Fetch all forecast transactions
            const { data: forecasts, error } = await (supabase
                .from('transactions')
                .select('id, nature, forecast_type, forecast_confidence, linked_forecast_id, transaction_date')
                .eq('company_id', companyId)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .eq('is_deleted', false) as any)
                .eq('nature', 'previsao');

            if (error) throw error;

            // Fetch converted transactions (linked to a forecast)
            const { data: converted, error: err2 } = await (supabase
                .from('transactions')
                .select('linked_forecast_id')
                .eq('company_id', companyId)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .eq('is_deleted', false) as any)
                .not('linked_forecast_id', 'is', null);

            if (err2) throw err2;

            const convertedIds = new Set((converted || []).map((c: { linked_forecast_id: string }) => c.linked_forecast_id));
            const allForecasts = forecasts || [];
            const today = new Date().toISOString().split('T')[0];

            const totalForecasts = allForecasts.length;
            let convertedCount = 0;
            let pendingCount = 0;
            let expiredCount = 0;
            let totalConfidence = 0;
            let confCount = 0;

            const typeMap = new Map<string, { count: number; converted: number }>();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allForecasts.forEach((f: any) => {
                const isConverted = convertedIds.has(f.id);
                const isPastDue = f.transaction_date < today;
                const type = f.forecast_type || 'estimativa';

                if (!typeMap.has(type)) typeMap.set(type, { count: 0, converted: 0 });
                const entry = typeMap.get(type)!;
                entry.count++;

                if (isConverted) {
                    convertedCount++;
                    entry.converted++;
                } else if (isPastDue) {
                    expiredCount++;
                } else {
                    pendingCount++;
                }

                if (f.forecast_confidence) {
                    totalConfidence += Number(f.forecast_confidence);
                    confCount++;
                }
            });

            const accuracyRate = totalForecasts > 0
                ? (convertedCount / Math.max(convertedCount + expiredCount, 1)) * 100
                : 0;

            const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
                type: type === 'orcamento' ? 'Orçamento' : type === 'estimativa' ? 'Estimativa' : type === 'simulacao' ? 'Simulação' : type,
                count: data.count,
                converted: data.converted,
            }));

            return {
                totalForecasts,
                converted: convertedCount,
                pending: pendingCount,
                expired: expiredCount,
                accuracyRate,
                byType,
                avgConfidence: confCount > 0 ? totalConfidence / confCount : 0,
            } as ForecastStats;
        },
        enabled: !!companyId,
        staleTime: 5 * 60 * 1000,
    });

    return { stats: data || { totalForecasts: 0, converted: 0, pending: 0, expired: 0, accuracyRate: 0, byType: [], avgConfidence: 0 }, isLoading };
}

// Animated ring gauge for accuracy
function AccuracyGauge({ value }: { value: number }) {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" className="text-muted/20 dark:text-white/10" strokeWidth="10" />
                <circle
                    cx="70" cy="70" r={radius} fill="none"
                    stroke={color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-[stroke-dashoffset] duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground dark:text-white tabular-nums">{value.toFixed(0)}%</span>
                <span className="text-[10px] text-muted-foreground font-medium dark:text-emerald-400/60 uppercase tracking-wider">Acerto</span>
            </div>
        </div>
    );
}

export const ForecastAccuracyChart = memo(function ForecastAccuracyChart() {
    const { stats, isLoading } = useForecastStats();

    const pieData = useMemo(() => [
        { name: 'Convertidas', value: stats.converted, color: '#10b981' },
        { name: 'Pendentes', value: stats.pending, color: '#3b82f6' },
        { name: 'Expiradas', value: stats.expired, color: '#ef4444' },
    ].filter(d => d.value > 0), [stats]);

    const barData = useMemo(() => stats.byType.map(t => ({
        name: t.type,
        Total: t.count,
        Convertidas: t.converted,
        Taxa: t.count > 0 ? Math.round((t.converted / t.count) * 100) : 0,
    })), [stats]);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border/50 shadow-sm p-0 bg-background dark:border-emerald-900/40 overflow-hidden">
                <div
                    className="dark px-6 py-4 border-b border-emerald-800/30"
                    style={{
                        background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
                        boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                    }}
                >
                    <Skeleton className="h-6 w-48" />
                </div>
                <div className="flex gap-6 p-6">
                    <Skeleton className="h-36 w-36 rounded-full" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (stats.totalForecasts === 0) {
        return (
            <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-background dark:border-emerald-900/40">
                <div
                    className="dark px-5 py-3.5 border-b border-emerald-800/30 flex items-center gap-2"
                    style={{
                        background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
                        boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                    }}
                >
                    <Target className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-emerald-100/90">Índice de Acerto das Previsões</h3>
                    <Badge variant="outline" className="text-[10px] border-emerald-700/40 text-emerald-300/70 bg-emerald-900/20">
                        {stats.totalForecasts} previsões
                    </Badge>
                </div>
                <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/30 dark:text-emerald-500/30 mb-3" />
                    <p className="text-sm text-muted-foreground/80 dark:text-emerald-100/50 font-medium">Nenhuma previsão registrada</p>
                    <p className="text-xs text-muted-foreground/50 dark:text-emerald-100/30 mt-1">Crie previsões para acompanhar o índice de acerto</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-background dark:border-emerald-900/40">
            {/* Header */}
            <div
                className="dark flex items-center gap-2 px-5 py-3.5 border-b border-emerald-800/30"
                style={{
                    background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
                    boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                }}
            >
                <Target className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-100/90">Índice de Acerto das Previsões</h3>
                <Badge variant="outline" className="text-[10px] border-emerald-700/40 text-emerald-300/70 bg-emerald-900/20">
                    {stats.totalForecasts} previsões
                </Badge>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Accuracy Ring */}
                    <div className="flex flex-col items-center gap-4">
                        <AccuracyGauge value={stats.accuracyRate} />

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 w-full">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                    <span className="text-lg font-bold text-emerald-400 tabular-nums">{stats.converted}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground dark:text-emerald-100/40 uppercase tracking-wider font-semibold">Convertidas</span>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-blue-400" />
                                    <span className="text-lg font-bold text-blue-400 tabular-nums">{stats.pending}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground dark:text-emerald-100/40 uppercase tracking-wider font-semibold">Pendentes</span>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <XCircle className="h-3 w-3 text-red-400" />
                                    <span className="text-lg font-bold text-red-400 tabular-nums">{stats.expired}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground dark:text-emerald-100/40 uppercase tracking-wider font-semibold">Expiradas</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Distribution pie chart */}
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] text-muted-foreground dark:text-emerald-100/50 uppercase tracking-wider mb-2 font-bold">Distribuição</span>
                        <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(10, 26, 18, 0.95)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#d1fae5',
                                        }}
                                        itemStyle={{ color: '#d1fae5' }}
                                        labelStyle={{ color: '#a7f3d0' }}
                                        formatter={(value: number, name: string) => [`${value}`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-3 mt-1">
                            {pieData.map(d => (
                                <div key={d.name} className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-[10px] text-muted-foreground font-medium dark:text-emerald-100/50">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: By Type bar chart */}
                    <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground dark:text-emerald-100/50 uppercase tracking-wider mb-2 font-bold text-center">Por Tipo</span>
                        {barData.length > 0 ? (
                            <div className="h-[170px] w-full text-muted-foreground/70 dark:text-emerald-200/50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: 'currentColor', fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: 'currentColor', fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(10, 26, 18, 0.95)',
                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                color: '#d1fae5',
                                            }}
                                            itemStyle={{ color: '#d1fae5' }}
                                            labelStyle={{ color: '#a7f3d0' }}
                                            formatter={(value: number, name: string) => [value, name]}
                                        />
                                        <Bar dataKey="Total" fill="rgba(59, 130, 246, 0.3)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Convertidas" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[170px] text-muted-foreground/50 dark:text-emerald-100/30 text-xs font-medium">
                                Sem dados por tipo
                            </div>
                        )}

                        {/* Avg confidence */}
                        {stats.avgConfidence > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-muted/50 dark:bg-emerald-900/20 border border-border/50 dark:border-emerald-800/20">
                                <span className="text-[10px] text-muted-foreground dark:text-emerald-100/40 font-medium uppercase tracking-wider">Confiança Média</span>
                                <span className={cn(
                                    "text-sm font-bold tabular-nums",
                                    stats.avgConfidence >= 70 ? 'text-emerald-400' : stats.avgConfidence >= 40 ? 'text-amber-400' : 'text-red-400'
                                )}>
                                    {stats.avgConfidence.toFixed(0)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ForecastAccuracyChart;
