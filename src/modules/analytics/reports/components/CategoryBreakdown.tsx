'use client';

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
  id: string;
  name: string;
  code: string;
  value: number;
  previousValue?: number;
  children?: CategoryData[];
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  currencySymbol?: string;
  title?: string;
}

interface CategoryRowProps {
  category: CategoryData;
  total: number;
  currencySymbol: string;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}

function CategoryRow({ category, total, currencySymbol, depth, isExpanded, onToggle, hasChildren }: CategoryRowProps) {
  const percentage = total > 0 ? (category.value / total) * 100 : 0;
  const trend = category.previousValue && category.previousValue > 0
    ? ((category.value - category.previousValue) / category.previousValue) * 100
    : null;

  const formatCurrency = (value: number) => {
    return `${currencySymbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Generate color based on depth and index
  const hue = (parseInt(category.code.replace(/\D/g, "") || "0") * 37) % 360;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-muted/50",
        depth > 0 && "ml-6"
      )}
    >
      {/* Expand/Collapse button */}
      <div className="w-6">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
            aria-label="Expandir/recolher categoria"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* Icon */}
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `hsl(${hue}, 70%, 50%, 0.15)` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4" style={{ color: `hsl(${hue}, 70%, 50%)` }} />
          ) : (
            <Folder className="h-4 w-4" style={{ color: `hsl(${hue}, 70%, 50%)` }} />
          )
        ) : (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
          />
        )}
      </div>

      {/* Name and Code */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{category.code}</span>
          <span className="font-medium truncate">{category.name}</span>
        </div>
        <div className="mt-1">
          <Progress
            value={percentage}
            className="h-1.5"
            style={{
              ["--progress-background" as any]: `hsl(${hue}, 70%, 50%)`,
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <Badge variant="outline" className="shrink-0">
        {percentage.toFixed(1)}%
      </Badge>

      {/* Value */}
      <div className="text-right shrink-0 w-32">
        <div className="font-semibold">{formatCurrency(category.value)}</div>
        {trend !== null && (
          <div className={cn(
            "flex items-center justify-end gap-1 text-xs",
            trend > 0 ? "text-destructive" : trend < 0 ? "text-success" : "text-muted-foreground"
          )}>
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

export function CategoryBreakdown({ data, currencySymbol = "R$", title = "Breakdown por Categoria" }: CategoryBreakdownProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const total = useMemo(() => {
    return data.reduce((acc, cat) => acc + cat.value, 0);
  }, [data]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const addIds = (categories: CategoryData[]) => {
      categories.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat.id);
          addIds(cat.children);
        }
      });
    };
    addIds(data);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const renderCategory = (category: CategoryData, depth: number = 0): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <CategoryRow
          category={category}
          total={total}
          currencySymbol={currencySymbol}
          depth={depth}
          isExpanded={isExpanded}
          onToggle={() => toggleExpand(category.id)}
          hasChildren={!!hasChildren}
        />
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-muted ml-5">
            {category.children!.sort((a, b) => b.value - a.value).map((child) =>
              renderCategory(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Sem dados para exibir
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expandir Tudo
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Recolher Tudo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sortedData.map((category) => renderCategory(category))}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-xl">
            {currencySymbol} {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
