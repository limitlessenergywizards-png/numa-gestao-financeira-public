import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface KPIItem {
    label: string;
    value: string;
    /** Optional formula or description shown in tooltip */
    formula?: string;
    /** Visual status color */
    status?: 'success' | 'warning' | 'danger' | 'neutral';
    /** Optional subtitle below the value */
    subtitle?: string;
}

interface StrategicKPISectionProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor: string;
    items: KPIItem[];
    isLoading: boolean;
    hasData: boolean;
    columns?: number;
}

const statusStyles = {
    success: 'border-l-emerald-500 bg-emerald-500/5',
    warning: 'border-l-amber-500 bg-amber-500/5',
    danger: 'border-l-rose-500 bg-rose-500/5',
    neutral: 'border-l-sky-500 bg-sky-500/5',
};

const statusDotStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-sky-500',
};

export function StrategicKPISection({
    title,
    description,
    icon: Icon,
    iconColor,
    items,
    isLoading,
    hasData,
    columns = 4,
}: StrategicKPISectionProps) {
    const gridClass = columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : columns === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

    return (
        <Card className="glass-card border-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconColor)}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className={cn('grid gap-4', gridClass)}>
                        {Array.from({ length: items.length || columns }).map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-lg" />
                        ))}
                    </div>
                ) : !hasData ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Sem dados suficientes para calcular estes indicadores.
                    </p>
                ) : (
                    <div className={cn('grid gap-4', gridClass)}>
                        {items.map((item, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    'rounded-xl border-l-4 p-4 transition-colors',
                                    statusStyles[item.status ?? 'neutral']
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn('h-2 w-2 rounded-full', statusDotStyles[item.status ?? 'neutral'])} />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                    </div>
                                    {item.formula && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs text-xs">
                                                    {item.formula}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="text-2xl font-bold tabular-nums tracking-tight">
                                    {item.value}
                                </p>
                                {item.subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
