'use client';

import { useState } from "react";
import { Filter, X, Check, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CategoryInfo {
  code: string;
  name: string;
  hasData: boolean;
}

interface CashFlowCategoryFilterProps {
  entradasCategories: CategoryInfo[];
  saidasCategories: CategoryInfo[];
  hiddenCategories: string[];
  hideEmptyCategories: boolean;
  onToggleCategory: (code: string) => void;
  onToggleHideEmpty: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export function CashFlowCategoryFilter({
  entradasCategories,
  saidasCategories,
  hiddenCategories,
  hideEmptyCategories,
  onToggleCategory,
  onToggleHideEmpty,
  onShowAll,
  onHideAll,
}: CashFlowCategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entradasExpanded, setEntradasExpanded] = useState(true);
  const [saidasExpanded, setSaidasExpanded] = useState(true);

  const totalCategories = entradasCategories.length + saidasCategories.length;
  const visibleCategories = totalCategories - hiddenCategories.length;
  const hasActiveFilter = hiddenCategories.length > 0 || hideEmptyCategories;

  const renderCategoryGroup = (
    title: string,
    categories: CategoryInfo[],
    isExpanded: boolean,
    onToggleExpanded: () => void,
    colorClass: string
  ) => (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md transition-colors">
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn("font-semibold text-sm", colorClass)}>
            {title}
          </span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {categories.filter(c => !hiddenCategories.includes(c.code)).length}/{categories.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 space-y-1">
        {categories.map((cat) => {
          const isHidden = hiddenCategories.includes(cat.code);
          const isEmptyAndHiding = hideEmptyCategories && !cat.hasData;
          
          return (
            <label
              key={cat.code}
              className={cn(
                "flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors hover:bg-muted/50",
                (isHidden || isEmptyAndHiding) && "opacity-50"
              )}
            >
              <Checkbox
                checked={!isHidden && !isEmptyAndHiding}
                onCheckedChange={() => onToggleCategory(cat.code)}
                disabled={isEmptyAndHiding}
              />
              <span className="text-xs flex-1 truncate">
                <span className="text-muted-foreground">{cat.code}</span>
                <span className="ml-1">{cat.name}</span>
              </span>
              {!cat.hasData && (
                <Badge variant="outline" className="h-4 px-1 text-[10px] text-muted-foreground">
                  vazio
                </Badge>
              )}
            </label>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2 transition-colors",
              hasActiveFilter && "border-primary bg-primary/5"
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
            {hasActiveFilter && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-1">
                {visibleCategories}/{totalCategories}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <span className="font-medium text-sm">Filtrar Categorias</span>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={onShowAll}
              >
                <Eye className="h-3 w-3 mr-1" />
                Todas
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={onHideAll}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Nenhuma
              </Button>
            </div>
          </div>
          
          {/* Hide empty toggle */}
          <div className="p-3 border-b">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={hideEmptyCategories}
                onCheckedChange={onToggleHideEmpty}
              />
              <span className="text-sm">Ocultar categorias sem movimentação</span>
            </label>
          </div>
          
          {/* Categories list */}
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-2">
              {renderCategoryGroup(
                "ENTRADAS",
                entradasCategories,
                entradasExpanded,
                () => setEntradasExpanded(!entradasExpanded),
                "text-emerald-600 dark:text-emerald-400"
              )}
              
              <Separator className="my-2" />
              
              {renderCategoryGroup(
                "SAÍDAS",
                saidasCategories,
                saidasExpanded,
                () => setSaidasExpanded(!saidasExpanded),
                "text-red-600 dark:text-red-400"
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {hiddenCategories.length > 0 && hiddenCategories.length <= 3 && (
        <div className="hidden md:flex gap-1 flex-wrap">
          {hiddenCategories.slice(0, 3).map((code) => (
            <Badge 
              key={code} 
              variant="secondary" 
              className="gap-1 cursor-pointer hover:bg-destructive/20 transition-colors text-xs h-6"
              onClick={() => onToggleCategory(code)}
            >
              {code}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {hiddenCategories.length > 3 && (
            <Badge variant="outline" className="text-xs h-6">
              +{hiddenCategories.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
