import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status badges com cores vibrantes
        success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300",
        warning: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
        danger: "bg-red-500/15 text-red-500 border-red-500/30 dark:bg-red-500/20 dark:text-red-400",
        info: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300",
        neutral: "bg-slate-500/15 text-slate-500 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
