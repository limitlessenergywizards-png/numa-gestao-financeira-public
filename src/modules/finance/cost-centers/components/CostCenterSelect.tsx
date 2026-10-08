'use client';

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCostCenters } from "../hooks/useCostCenters";
import { CostCenterDialog } from "./CostCenterDialog";
import { cn } from "@/lib/utils";

interface CostCenterSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
  showInactive?: boolean;
}

export function CostCenterSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Centro de Custo",
  allowCreate = true,
  className,
  showInactive = false,
}: CostCenterSelectProps) {
  const { costCenters, activeCostCenters, isLoading, createCostCenter } = useCostCenters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const displayCostCenters = showInactive ? costCenters : activeCostCenters;

  const handleCreateCostCenter = async (data: Parameters<typeof createCostCenter>[0]) => {
    const newCostCenter = await createCostCenter(data);
    if (newCostCenter) {
      onChange(newCostCenter.id);
      return newCostCenter;
    }
    return null;
  };

  const selectedCostCenter = costCenters.find((cc) => cc.id === value);

  return (
    <>
      <div className={cn("flex gap-2", className)}>
        <Select
          value={value || "none"}
          onValueChange={(val) => onChange(val === "none" ? null : val)}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder}>
              {selectedCostCenter ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedCostCenter.color }}
                  />
                  <span className="truncate">
                    {selectedCostCenter.code} - {selectedCostCenter.name}
                  </span>
                </div>
              ) : (
                placeholder
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">Nenhum</span>
            </SelectItem>
            {displayCostCenters.map((costCenter) => (
              <SelectItem key={costCenter.id} value={costCenter.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: costCenter.color }}
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {costCenter.code}
                  </span>
                  <span className="truncate">{costCenter.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {allowCreate && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            className="shrink-0"
            aria-label="Criar centro de custo"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CostCenterDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateCostCenter}
      />
    </>
  );
}
