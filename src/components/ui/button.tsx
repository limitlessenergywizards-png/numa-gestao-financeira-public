import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-brand/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-brand underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-[#C5A059] to-[#A98A4A] text-white shadow-lg hover:shadow-xl hover:shadow-[#C5A059]/25 hover:brightness-110 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,transform,filter]",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-lg hover:shadow-success/25",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/25",
        // Numa Brand Gold Primary Button
        brand: "bg-[#C5A059] text-[#1B3B34] font-semibold shadow-lg hover:shadow-xl hover:shadow-[#C5A059]/30 hover:-translate-y-0.5 hover:bg-[#D6B879] transition-[color,background-color,border-color,box-shadow,transform] duration-200",
        // Ghost brand for secondary actions
        "ghost-brand": "text-[#C5A059] hover:bg-[#C5A059]/10 hover:text-[#C5A059]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, disabled, children, ...props }, ref) => {
    if (asChild) {
      return <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} aria-disabled={disabled || undefined} {...props}>{children}</Slot>;
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), isLoading && "relative")}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className={cn("inline-flex items-center gap-2 transition-opacity duration-150", isLoading && "opacity-0")}>
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size={size === "sm" || size === "icon" ? "xs" : "sm"} />
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
