'use client';

import { motion } from "framer-motion";
import { FileText, PenLine, Check, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/data/templates";

interface ChartTemplateChoiceProps {
  value: string;
  onChange: (value: string) => void;
  currentSegment?: string;
}

export function ChartTemplateChoice({ value, onChange, currentSegment }: ChartTemplateChoiceProps) {
  // Get template keys and sort by default + name
  const templateKeys = Object.keys(TEMPLATES).sort((a, b) => {
    const aIsDefault = TEMPLATES[a as keyof typeof TEMPLATES].isDefault ? 0 : 1;
    const bIsDefault = TEMPLATES[b as keyof typeof TEMPLATES].isDefault ? 0 : 1;
    if (aIsDefault !== bIsDefault) return aIsDefault - bIsDefault;
    return a.localeCompare(b);
  });

  // Find the template for current segment (or default if not found)
  const segmentTemplateKey = templateKeys.find(key => {
    const template = TEMPLATES[key as keyof typeof TEMPLATES];
    return template.segment === currentSegment;
  }) || 'padrao';

  return (
    <motion.div
      key="chart-template"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
          <FolderTree className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Plano de Contas</h2>
        <p className="text-sm text-muted-foreground">
          Escolha o template mais adequado para seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template Options */}
        {templateKeys.map((key) => {
          const template = TEMPLATES[key as keyof typeof TEMPLATES];
          const isSelected = value === key;
          const isSegmentMatch = key === segmentTemplateKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "relative flex flex-col items-start p-6 rounded-xl border-2 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                </motion.div>
              )}

              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>

              <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>

              {isSegmentMatch && !template.isDefault && (
                <div className="mb-3 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                  ⭐ Recomendado para seu segmento
                </div>
              )}

              {template.isDefault && (
                <div className="mb-3 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                  ✓ Recomendado
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty/Custom Option */}
      <button
        type="button"
        onClick={() => onChange("empty")}
        className={cn(
          "w-full relative flex flex-col items-start p-6 rounded-xl border-2 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/50",
          value === "empty"
            ? "border-primary bg-primary/5 shadow-lg"
            : "border-border bg-card hover:bg-muted/50"
        )}
      >
        {value === "empty" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          </motion.div>
        )}

        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
          <PenLine className="w-6 h-6 text-muted-foreground" />
        </div>

        <h3 className="font-semibold text-lg mb-2">Começar Vazio</h3>
        <p className="text-sm text-muted-foreground">
          Crie suas próprias contas do zero com total personalização. Ideal para usuários avançados.
        </p>
      </button>

      <p className="text-xs text-center text-muted-foreground">
        💡 Você poderá personalizar o plano de contas a qualquer momento
      </p>
    </motion.div>
  );
}
