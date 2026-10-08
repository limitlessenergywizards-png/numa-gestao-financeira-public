'use client';

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb, 
  Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw, 
  Smile, Meh, Frown, Info, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AnimatedScenarioChart } from "./AnimatedScenarioChart";
import { 
  ScenarioType, 
  useCashFlowProjection,
  HistoricalData,
  CategoryData
} from "../hooks/useCashFlowProjection";

interface CashFlowProjectionPanelProps {
  historicalData: HistoricalData[];
  categories: CategoryData[];
  currentBalance: number;
  formatCurrency: (value: number) => string;
  onClose: () => void;
}

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export function CashFlowProjectionPanel({
  historicalData,
  categories,
  currentBalance,
  formatCurrency,
  onClose
}: CashFlowProjectionPanelProps) {
  const [projectionWeeks, setProjectionWeeks] = useState(4);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('realistic');
  const [insightsOpen, setInsightsOpen] = useState(true);
  
  const { generateProjection, loading, result, error } = useCashFlowProjection();

  const handleGenerate = async () => {
    await generateProjection(historicalData, categories, projectionWeeks, currentBalance);
  };

  const chartData = useMemo(() => {
    if (!result) return [];
    
    const data: { week: string; otimista: number; realista: number; pessimista: number }[] = [];
    const maxWeeks = Math.max(
      result.scenarios.optimistic.weeklyProjections.length,
      result.scenarios.realistic.weeklyProjections.length,
      result.scenarios.pessimistic.weeklyProjections.length
    );

    for (let i = 0; i < maxWeeks; i++) {
      const opt = result.scenarios.optimistic.weeklyProjections[i];
      const real = result.scenarios.realistic.weeklyProjections[i];
      const pess = result.scenarios.pessimistic.weeklyProjections[i];

      data.push({
        week: `S${opt?.weekNumber || real?.weekNumber || i + 1}`,
        otimista: opt?.saldoAcumulado || 0,
        realista: real?.saldoAcumulado || 0,
        pessimista: pess?.saldoAcumulado || 0
      });
    }

    return data;
  }, [result]);

  const scenarioCards = useMemo(() => {
    if (!result) return [];
    
    return [
      {
        key: 'optimistic' as ScenarioType,
        scenario: result.scenarios.optimistic,
        icon: Smile,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        borderColor: 'border-emerald-500',
        label: 'Otimista'
      },
      {
        key: 'realistic' as ScenarioType,
        scenario: result.scenarios.realistic,
        icon: Meh,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-500',
        label: 'Realista'
      },
      {
        key: 'pessimistic' as ScenarioType,
        scenario: result.scenarios.pessimistic,
        icon: Frown,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-500',
        label: 'Pessimista'
      }
    ];
  }, [result]);

  return (
    <Card className="border-primary/20 shadow-lg mb-4">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-lg truncate">Projeção com IA</CardTitle>
              <CardDescription className="text-[10px] sm:text-sm hidden xs:block truncate">
                Cenários otimista, realista e pessimista
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={onClose} aria-label="Fechar painel de projeção">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-sm text-muted-foreground">Semanas:</span>
            <Select value={String(projectionWeeks)} onValueChange={(v) => setProjectionWeeks(Number(v))}>
              <SelectTrigger className="w-[60px] sm:w-[70px] h-7 sm:h-8 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8].map(w => (
                  <SelectItem key={w} value={String(w)}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            size="sm"
            className="h-7 sm:h-8 text-xs sm:text-sm gap-1 sm:gap-2"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            {loading ? 'Analisando...' : result ? 'Recalcular' : 'Gerar'}
          </Button>

          {result && (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-[9px] sm:text-xs text-muted-foreground hidden xs:inline">Confiança:</span>
                    <Progress value={result.confidence} className="w-12 sm:w-20 h-1.5 sm:h-2" />
                    <span className="text-[9px] sm:text-xs font-medium">{result.confidence}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Nível de confiança baseado na qualidade dos dados
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-2 sm:p-3 rounded-lg bg-destructive/10 text-destructive text-xs sm:text-sm flex items-center gap-2"
          >
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{error}</span>
          </motion.div>
        )}

        {result && (
          <>
            {/* Scenario Cards - Animated */}
            <motion.div 
              className="grid grid-cols-3 gap-1.5 sm:gap-3"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {scenarioCards.map(({ key, scenario, icon: Icon, color, bgColor, borderColor, label }) => (
                <motion.button
                  key={key}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedScenario(key)}
                  className={cn(
                    "p-1.5 sm:p-3 rounded-lg border-2 transition-[border-color,box-shadow] text-left",
                    bgColor,
                    selectedScenario === key ? borderColor : "border-transparent",
                    selectedScenario === key && "ring-1 sm:ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-2">
                    <Icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", color)} />
                    <span className={cn("font-semibold text-[9px] sm:text-sm truncate", color)}>{label}</span>
                  </div>
                  
                  {/* Animated value */}
                  <motion.div 
                    key={scenario.finalBalance}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "text-xs sm:text-lg font-bold tabular-nums", 
                      scenario.finalBalance >= 0 ? "text-emerald-600" : "text-destructive"
                    )}
                  >
                    <span className="sm:hidden">{formatCompact(scenario.finalBalance)}</span>
                    <span className="hidden sm:inline">{formatCurrency(scenario.finalBalance)}</span>
                  </motion.div>
                  
                  {/* Mini stats */}
                  <div className="hidden xs:flex items-center gap-0.5 sm:gap-2 mt-0.5 sm:mt-1 text-[8px] sm:text-xs text-muted-foreground">
                    <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{formatCompact(scenario.totalEntradas)}</span>
                    <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 text-red-500 shrink-0" />
                    <span className="truncate">{formatCompact(scenario.totalSaidas)}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Chart - Animated */}
            <AnimatedScenarioChart
              data={chartData}
              selectedScenario={selectedScenario}
              formatCurrency={formatCurrency}
              currentBalance={currentBalance}
            />

            {/* AI Insights - Animated */}
            <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 sm:p-3 h-auto">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                    <span className="font-medium text-xs sm:text-sm">Insights da IA</span>
                  </div>
                  <motion.div
                    animate={{ rotate: insightsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.div>
                </Button>
              </CollapsibleTrigger>
              <AnimatePresence>
                {insightsOpen && (
                  <CollapsibleContent forceMount>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 sm:space-y-3 px-1 sm:px-3 pb-2 sm:pb-3">
                        {/* Narrative */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="p-2 sm:p-3 rounded-lg bg-muted/50 text-[10px] sm:text-sm italic"
                        >
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2 text-primary" />
                          {result.analysisNarrative}
                        </motion.div>

                        {/* Grid of insights */}
                        <motion.div 
                          className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.15 } }
                          }}
                        >
                          {/* Seasonality */}
                          {result.seasonalityInsights.length > 0 && (
                            <motion.div 
                              variants={itemVariants}
                              className="space-y-1 sm:space-y-2"
                            >
                              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium">
                                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                                Sazonalidade
                              </div>
                              <ul className="space-y-0.5 sm:space-y-1">
                                {result.seasonalityInsights.slice(0, 2).map((insight, i) => (
                                  <li key={i} className="text-[9px] sm:text-xs text-muted-foreground flex items-start gap-1">
                                    <span className="text-blue-500 shrink-0">•</span>
                                    <span className="line-clamp-2">{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}

                          {/* Risks */}
                          {result.riskFactors.length > 0 && (
                            <motion.div 
                              variants={itemVariants}
                              className="space-y-1 sm:space-y-2"
                            >
                              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium">
                                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                Riscos
                              </div>
                              <ul className="space-y-0.5 sm:space-y-1">
                                {result.riskFactors.slice(0, 2).map((risk, i) => (
                                  <li key={i} className="text-[9px] sm:text-xs text-muted-foreground flex items-start gap-1">
                                    <span className="text-red-500 shrink-0">•</span>
                                    <span className="line-clamp-2">{risk}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}

                          {/* Opportunities */}
                          {result.opportunities.length > 0 && (
                            <motion.div 
                              variants={itemVariants}
                              className="space-y-1 sm:space-y-2"
                            >
                              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium">
                                <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                                Oportunidades
                              </div>
                              <ul className="space-y-0.5 sm:space-y-1">
                                {result.opportunities.slice(0, 2).map((opp, i) => (
                                  <li key={i} className="text-[9px] sm:text-xs text-muted-foreground flex items-start gap-1">
                                    <span className="text-emerald-500 shrink-0">•</span>
                                    <span className="line-clamp-2">{opp}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                )}
              </AnimatePresence>
            </Collapsible>
          </>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4 sm:py-8 text-muted-foreground"
          >
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">Clique em "Gerar" para análise com IA</p>
            <p className="text-[10px] sm:text-xs mt-1 hidden xs:block">
              Regressão linear + média móvel ponderada
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
