'use client';

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
}

export function FilterBar({ children, onClear, showClear, className }: FilterBarProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border",
      className
    )}>
      <div className="flex flex-wrap items-center gap-4 flex-1">
        {children}
      </div>
      {showClear && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
