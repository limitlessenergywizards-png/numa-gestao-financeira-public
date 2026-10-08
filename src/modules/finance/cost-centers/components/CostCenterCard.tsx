'use client';

import { CostCenter } from "../hooks/useCostCenters";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Power, PowerOff } from "lucide-react";

interface CostCenterCardProps {
  costCenter: CostCenter;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (costCenter: CostCenter) => void;
  onToggleActive: (costCenter: CostCenter) => void;
  canEdit: boolean;
}

export function CostCenterCard({
  costCenter,
  onEdit,
  onDelete,
  onToggleActive,
  canEdit,
}: CostCenterCardProps) {
  return (
    <div className="animate-fade-in">
      <Card className="bg-card border-border/50 hover:border-brand/40 transition-[border-color,box-shadow] duration-200 group shadow-sm hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-4 h-4 rounded-full shrink-0 ring-2 ring-background shadow-sm"
                style={{ backgroundColor: costCenter.color }}
              />
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {costCenter.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {costCenter.code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={costCenter.is_active ? "default" : "secondary"}
                className={
                  costCenter.is_active
                    ? "bg-success/10 text-success border-success/20 font-medium"
                    : "bg-muted text-muted-foreground font-medium"
                }
              >
                {costCenter.is_active ? "Ativo" : "Inativo"}
              </Badge>

              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Opções do centro de custo"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(costCenter)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(costCenter)}>
                      {costCenter.is_active ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(costCenter)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {costCenter.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {costCenter.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
