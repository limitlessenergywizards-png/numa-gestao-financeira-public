import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Filter, ChevronDown, MessageSquare, Wallet, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DREPeriod } from '../hooks/useDREData';

interface DREFiltersCardProps {
  period: DREPeriod;
  onPeriodChange: (period: DREPeriod) => void;
  accountingRegime: 'competencia' | 'caixa';
  onAccountingRegimeChange: (regime: 'competencia' | 'caixa') => void;
  comparisonMode: 'period' | 'budget';
  onComparisonModeChange: (mode: 'period' | 'budget') => void;
  periodDates: { currentStart: Date; currentEnd: Date };
  notesCount: number;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (expanded: boolean) => void;
  periodLabel: string;
  t: (key: string) => string;
}

const FiltersContent = memo(function FiltersContent({
  period,
  onPeriodChange,
  accountingRegime,
  onAccountingRegimeChange,
  comparisonMode,
  onComparisonModeChange,
  periodDates,
  notesCount,
  t,
}: Omit<DREFiltersCardProps, 'filtersExpanded' | 'onFiltersExpandedChange' | 'periodLabel'>) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-end">
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium">{t("common.period")}</label>
        <Select value={period} onValueChange={(v) => onPeriodChange(v as DREPeriod)}>
          <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Mês Atual</SelectItem>
            <SelectItem value="previous_month">Mês Anterior</SelectItem>
            <SelectItem value="quarter">Trimestre Atual</SelectItem>
            <SelectItem value="previous_quarter">Trimestre Anterior</SelectItem>
            <SelectItem value="semester">Semestre Atual</SelectItem>
            <SelectItem value="year">Ano Atual</SelectItem>
            <SelectItem value="previous_year">Ano Anterior</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" />
          Regime
        </label>
        <Select value={accountingRegime} onValueChange={(v) => onAccountingRegimeChange(v as 'competencia' | 'caixa')}>
          <SelectTrigger className="w-full sm:w-44 h-9 sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="competencia">Competência</SelectItem>
            <SelectItem value="caixa">Caixa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Comparação
        </label>
        <Select value={comparisonMode} onValueChange={(v) => onComparisonModeChange(v as 'period' | 'budget')}>
          <SelectTrigger className="w-full sm:w-44 h-9 sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="period">Período Anterior</SelectItem>
            <SelectItem value="budget">Orçado (Meta)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">
        {format(periodDates.currentStart, "dd/MM/yyyy")} a {format(periodDates.currentEnd, "dd/MM/yyyy")}
      </div>
      {notesCount > 0 && (
        <div className="sm:ml-auto flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {notesCount} nota{notesCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
});

export const DREFiltersCard = memo(function DREFiltersCard(props: DREFiltersCardProps) {
  const { filtersExpanded, onFiltersExpandedChange, periodLabel, ...filterProps } = props;

  return (
    <Card>
      <Collapsible open={filtersExpanded} onOpenChange={onFiltersExpandedChange}>
        {/* Mobile: collapsible header */}
        <CollapsibleTrigger asChild className="sm:hidden">
          <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Filtros</span>
                <Badge variant="secondary" className="text-xs">
                  {periodLabel}
                </Badge>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                filtersExpanded && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="sm:hidden">
          <CardContent className="p-3 pt-0">
            <FiltersContent {...filterProps} />
          </CardContent>
        </CollapsibleContent>

        {/* Desktop: always visible */}
        <CardContent className="hidden sm:block pt-6">
          <FiltersContent {...filterProps} />
        </CardContent>
      </Collapsible>
    </Card>
  );
});
