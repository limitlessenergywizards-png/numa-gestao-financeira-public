'use client';

import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tag,
  Plus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryTemplate, getCategoriesBySegment } from "@/data/categoryTemplates";

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  type: "receita" | "despesa";
}

interface StepCategoriesProps {
  segment: string;
  categories: CategoryItem[];
  onChange: (categories: CategoryItem[]) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const StepCategories = memo(function StepCategories({
  segment,
  categories,
  onChange
}: StepCategoriesProps) {
  const [newReceitaName, setNewReceitaName] = useState("");
  const [newDespesaName, setNewDespesaName] = useState("");

  // Initialize categories from template when segment changes
  useEffect(() => {
    if (categories.length === 0 && segment) {
      const templateCategories = getCategoriesBySegment(segment);
      const initialCategories: CategoryItem[] = templateCategories.map((cat) => ({
        id: generateId(),
        name: cat.name,
        color: cat.color,
        type: cat.type,
      }));
      onChange(initialCategories);
    }
  }, [segment, categories.length, onChange]);

  const receitas = categories.filter((c) => c.type === "receita");
  const despesas = categories.filter((c) => c.type === "despesa");

  const addCategory = (type: "receita" | "despesa") => {
    const name = type === "receita" ? newReceitaName : newDespesaName;
    if (!name.trim()) return;

    const newCat: CategoryItem = {
      id: generateId(),
      name: name.trim(),
      color: type === "receita" ? "#10B981" : "#EF4444",
      type,
    };

    onChange([...categories, newCat]);

    if (type === "receita") {
      setNewReceitaName("");
    } else {
      setNewDespesaName("");
    }
  };

  const removeCategory = (id: string) => {
    onChange(categories.filter((c) => c.id !== id));
  };

  const isValid = receitas.length >= 1 && despesas.length >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
          <Tag className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Configure suas Categorias</h2>
        <p className="text-sm text-muted-foreground">
          Categorias bem definidas = relatórios precisos
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Receitas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-success">
            <ArrowUpCircle className="w-5 h-5" />
            <span className="font-medium">Receitas ({receitas.length}/3+)</span>
            {receitas.length >= 3 && <Check className="w-4 h-4" />}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {receitas.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm truncate">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newReceitaName}
              onChange={(e) => setNewReceitaName(e.target.value)}
              placeholder="Nova categoria..."
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && addCategory("receita")}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => addCategory("receita")}
              disabled={!newReceitaName.trim()}
              aria-label="Adicionar categoria de receita"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Despesas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <ArrowDownCircle className="w-5 h-5" />
            <span className="font-medium">Despesas ({despesas.length}/3+)</span>
            {despesas.length >= 3 && <Check className="w-4 h-4" />}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {despesas.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm truncate">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newDespesaName}
              onChange={(e) => setNewDespesaName(e.target.value)}
              placeholder="Nova categoria..."
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && addCategory("despesa")}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => addCategory("despesa")}
              disabled={!newDespesaName.trim()}
              aria-label="Adicionar categoria de despesa"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Validation */}
      {!isValid && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Adicione pelo menos 1 categoria de cada tipo</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        💡 Dica: Você pode pular esta etapa e configurar depois
      </p>
    </motion.div>
  );
});

StepCategories.displayName = "StepCategories";