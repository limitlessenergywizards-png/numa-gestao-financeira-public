'use client';

import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DREBudgetItem } from "../hooks/useDREBudget";

interface Category {
  code: string;
  name: string;
  type: string;
}

interface DREBudgetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  year: number;
  month: number;
  currentBudget: DREBudgetItem[];
  categories: Category[];
  onSave: (items: Omit<DREBudgetItem, "id" | "created_at" | "updated_at">[]) => Promise<void>;
  formatCurrency: (value: number) => string;
}

export function DREBudgetEditor({
  open,
  onOpenChange,
  companyId,
  year,
  month,
  currentBudget,
  categories,
  onSave,
  formatCurrency,
}: DREBudgetEditorProps) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize with current budget values
    const initialValues: Record<string, number> = {};
    categories.forEach((cat) => {
      const existing = currentBudget.find((b) => b.category_code === cat.code);
      initialValues[cat.code] = existing?.budgeted_value || 0;
    });
    setValues(initialValues);
  }, [currentBudget, categories, open]);

  const handleValueChange = (code: string, value: string) => {
    const numValue = parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
    setValues((prev) => ({ ...prev, [code]: numValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const items = categories.map((cat) => ({
        company_id: companyId,
        period_year: year,
        period_month: month,
        category_code: cat.code,
        category_name: cat.name,
        budgeted_value: values[cat.code] || 0,
      }));
      await onSave(items);
    } finally {
      setIsSaving(false);
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Definir Orçamento</DialogTitle>
          <DialogDescription>
            {monthNames[month - 1]} de {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {categories.map((cat) => (
            <div key={cat.code} className="space-y-2">
              <Label htmlFor={`budget-${cat.code}`} className="text-sm">
                {cat.name}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  id={`budget-${cat.code}`}
                  type="number"
                  step="0.01"
                  value={values[cat.code] || ""}
                  onChange={(e) => handleValueChange(cat.code, e.target.value)}
                  className="pl-9"
                  placeholder="0,00"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Orçamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
