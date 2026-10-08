/**
 * StatusBadge - Reusable status indicator component
 * 
 * Displays payment status with consistent styling across the app.
 * Replaces duplicated badge logic in Payables, Receivables, etc.
 */

import { Badge } from './badge';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { PayableStatus, ReceivableStatus } from '@/types';

type Status = PayableStatus | ReceivableStatus;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline"
      className={cn('font-medium border-0', STATUS_COLORS[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
