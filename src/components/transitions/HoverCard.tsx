'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  hoverY?: number;
  tapScale?: number;
  disabled?: boolean;
}

export const HoverCard = ({
  children,
  className,
  hoverY = -4,
  tapScale = 0.98,
  disabled = false,
}: HoverCardProps) => {
  if (disabled) {
    return (
      <div className={cn('transition-transform duration-200 hover:-translate-y-1', className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn('transition-transform duration-200 ease-out', className)}
      onMouseEnter={(e) => { e.currentTarget.style.transform = `translateY(${hoverY}px)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = `scale(${tapScale})`; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = `translateY(${hoverY}px)`; }}
    >
      {children}
    </div>
  );
};
