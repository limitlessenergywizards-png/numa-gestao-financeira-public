'use client';

import { memo } from "react";
import { cn } from "@/lib/utils";

interface CashFlowCellProps {
  value: number;
  columnKey: string | number;
  categoryCode: string;
  categoryName: string;
  heatmapColor?: string;
  isEntrada: boolean;
  granularity: 'week' | 'day';
  groupType: 'entrada' | 'saida';
  formatCurrency: (value: number) => string;
  onCellClick: (code: string, name: string, key: string | number, type: 'entrada' | 'saida') => void;
}

function CashFlowCellInner({
  value,
  columnKey,
  categoryCode,
  categoryName,
  heatmapColor,
  isEntrada,
  granularity,
  groupType,
  formatCurrency,
  onCellClick,
}: CashFlowCellProps) {
  return (
    <td
      style={heatmapColor ? { backgroundColor: heatmapColor } : undefined}
      className={cn(
        "text-right whitespace-nowrap",
        granularity === 'week' ? "px-3 py-2 text-sm" : "px-1 py-1.5 text-xs",
        value > 0
          ? cn(
            isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            "cursor-pointer hover:bg-primary/10 hover:underline"
          )
          : "text-muted-foreground"
      )}
      title={value > 0 ? "Clique para ver detalhes" : undefined}
      onClick={() => value > 0 && onCellClick(categoryCode, categoryName, columnKey, groupType)}
    >
      {value > 0 ? formatCurrency(value) : "-"}
    </td>
  );
}

export const CashFlowCell = memo(CashFlowCellInner, (prev, next) =>
  prev.value === next.value &&
  prev.heatmapColor === next.heatmapColor &&
  prev.isEntrada === next.isEntrada &&
  prev.granularity === next.granularity
);
