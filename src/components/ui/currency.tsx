import { cn } from "@/lib/utils";

export interface CurrencyProps {
  value: number;
  symbol?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  showSign?: boolean;
  colorize?: boolean;
  className?: string;
  decimals?: number;
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

/**
 * Standardized currency display component.
 * 
 * Ensures consistent formatting across the entire application:
 * - Symbol (R$) is always inline with the value (no line breaks)
 * - Symbol is smaller (0.7em) and slightly transparent
 * - Uses tabular-nums for proper alignment in tables
 * - Always shows 2 decimal places (Brazilian standard)
 * 
 * @example
 * <Currency value={1500.00} />           // R$ 1.500,00
 * <Currency value={-350.50} colorize />  // - R$ 350,50 (red)
 * <Currency value={1000} size="3xl" />   // R$ 1.000,00 (large)
 */
export function Currency({
  value,
  symbol = "R$",
  size = "md",
  showSign = false,
  colorize = false,
  className,
  decimals = 2,
}: CurrencyProps) {
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  const formatted = absValue.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Determine sign prefix
  let signPrefix = "";
  if (isNegative) {
    signPrefix = "- ";
  } else if (showSign && value > 0) {
    signPrefix = "+ ";
  }

  // Color based on value
  const colorClass = colorize
    ? isNegative
      ? "text-destructive"
      : value > 0
        ? "text-success"
        : ""
    : "";

  return (
    <span
      className={cn(
        "font-semibold tabular-nums whitespace-nowrap",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {signPrefix}
      <span className="text-[0.7em] mr-0.5 font-medium opacity-80">
        {symbol}
      </span>
      {formatted}
    </span>
  );
}
