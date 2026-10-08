'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
}

export const AnimatedButton = ({
  children,
  className,
  hoverScale = 1.03,
  tapScale = 0.97,
}: AnimatedButtonProps) => {
  return (
    <div
      className={cn('inline-flex transition-transform duration-150 ease-out', className)}
      style={{
        '--hover-scale': hoverScale,
        '--tap-scale': tapScale,
      } as React.CSSProperties}
      onMouseEnter={(e) => { e.currentTarget.style.transform = `scale(${hoverScale})`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = `scale(${tapScale})`; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = `scale(${hoverScale})`; }}
    >
      {children}
    </div>
  );
};
