/**
 * PaymentMethodBadge - Reusable payment method indicator
 * 
 * Displays payment method with consistent styling across the app.
 * Replaces duplicated badge logic in Transactions, Payables, etc.
 */

import { Badge } from './badge';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/types';

interface PaymentMethodBadgeProps {
  method: PaymentMethod | string | null | undefined;
  className?: string;
  showLabel?: boolean;
}

export function PaymentMethodBadge({ 
  method, 
  className,
  showLabel = true 
}: PaymentMethodBadgeProps) {
  // Handle null/undefined or unknown methods
  if (!method) return null;
  
  const normalizedMethod = method as PaymentMethod;
  const label = PAYMENT_METHOD_LABELS[normalizedMethod];
  const colorClass = PAYMENT_METHOD_COLORS[normalizedMethod];
  
  // If method is not in our predefined list, show it as-is
  if (!label) {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-xs font-normal border-0 bg-muted', className)}
      >
        {method}
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline"
      className={cn('text-xs font-normal border-0', colorClass, className)}
    >
      {showLabel ? label : method.toUpperCase()}
    </Badge>
  );
}
