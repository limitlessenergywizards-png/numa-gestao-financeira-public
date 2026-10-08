/**
 * DashboardSection Component
 *
 * A labeled section container that groups dashboard cards/widgets
 * following the hierarchical pattern from the reference design.
 * Provides a subtle section label and optional bordered container.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/transitions';

interface DashboardSectionProps {
    /** Section label shown in the top-left corner */
    label: string;
    children: ReactNode;
    className?: string;
    /** Whether to show a subtle border around the section */
    bordered?: boolean;
}

export function DashboardSection({
    label,
    children,
    className,
    bordered = false,
}: DashboardSectionProps) {
    return (
        <section className={cn('space-y-4', className)}>
            {/* Section Label */}
            <FadeIn direction="left" distance={12} duration={0.3}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                    {label}
                </h2>
            </FadeIn>

            {/* Section Content */}
            <div
                className={cn(
                    bordered && 'rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5'
                )}
            >
                {children}
            </div>
        </section>
    );
}

DashboardSection.displayName = 'DashboardSection';
