'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Tag, ShoppingCart, Briefcase, Car, Home, Utensils, Heart, Zap, Smartphone, Gift, Plane, GraduationCap, Music, Film, Dumbbell, Coffee, Wallet, CreditCard, TrendingUp } from "lucide-react";
import type { Category } from "../hooks/useCategories";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  tag: Tag,
  "shopping-cart": ShoppingCart,
  briefcase: Briefcase,
  car: Car,
  home: Home,
  utensils: Utensils,
  heart: Heart,
  zap: Zap,
  smartphone: Smartphone,
  gift: Gift,
  plane: Plane,
  "graduation-cap": GraduationCap,
  music: Music,
  film: Film,
  dumbbell: Dumbbell,
  coffee: Coffee,
  wallet: Wallet,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
};

const TYPE_LABELS: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  ambos: "Ambos",
};

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
  onToggleActive,
  canEdit,
  canDelete,
}: CategoryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const IconComponent = ICON_MAP[category.icon] || Tag;

  return (
    <>
      <Card 
        className="group relative overflow-hidden transition-[transform,box-shadow] hover:shadow-md"
        style={{ borderLeftColor: category.color, borderLeftWidth: "4px" }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <IconComponent
                  className="h-5 w-5"
                  style={{ color: category.color }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{category.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[category.type]}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={category.is_active}
                onCheckedChange={(checked) => onToggleActive(category.id, checked)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border/50">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                className="h-8 px-2"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{category.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(category.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
