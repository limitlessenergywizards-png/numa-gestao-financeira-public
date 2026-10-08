import { memo, Suspense, lazy } from 'react';
import { formatCompactStandalone } from '@/hooks/useFormatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  LineChart,
  Calendar,
  CalendarDays,
  PieChart,
  GitCompare
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { format, parseISO } from 'date-fns';

import { DailyView } from './DailyView';
import { WeeklyView } from './WeeklyView';
import { MonthlyView } from './MonthlyView';
import { ComparisonView, type MonthlyComparisonData } from './ComparisonView';
import { CategoryPieCharts } from './CategoryPieCharts';
import { CashFlowMatrixView } from './CashFlowMatrixView';
import type {
  DetailedTransaction,
  DailyDetail,
  WeeklyData,
  MonthlyData
} from './CashFlowTypes';

// ============================================
// TYPES
// ============================================

interface CashFlowTabsContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dailyData: DailyDetail[];
  weeklyData: WeeklyData[];
  monthlyData: MonthlyData;
  transactions: DetailedTransaction[];
  comparisonData: MonthlyComparisonData[];
  formatCurrency: (value: number) => string;
  saldoInicial: number;
  startDate: string;
  endDate: string;
  periodLabel: string;
}

// ============================================
// CONSTANTS
// ============================================

const tabsConfig = [
  { value: "matriz", icon: LayoutGrid, label: "Matriz" },
  { value: "grafico", icon: LineChart, label: "Gráfico" },
  { value: "diario", icon: Calendar, label: "Diário" },
  { value: "semanal", icon: CalendarDays, label: "Semanal" },
  { value: "mensal", icon: PieChart, label: "Mensal" },
  { value: "comparativo", icon: GitCompare, label: "Comparativo" },
];

const motionConfig = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

// ============================================
// TAB LOADING SKELETON
// ============================================

const TabSkeleton = () => (
  <Card>
    <CardContent className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-16 sm:w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20 sm:w-24" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// ============================================
// CHART TAB CONTENT
// ============================================

interface ChartTabProps {
  dailyData: DailyDetail[];
  transactions: DetailedTransaction[];
  formatCurrency: (value: number) => string;
}

const ChartTabContent = memo(function ChartTabContent({
  dailyData,
  transactions,
  formatCurrency,
}: ChartTabProps) {
  const chartData = dailyData.map(d => ({
    date: format(parseISO(d.date), 'dd/MM'),
    Entradas: d.entradas,
    Saídas: d.saidas,
    Saldo: d.saldoAcumulado,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Fluxo de Caixa</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Visualização de entradas, saídas e saldo acumulado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={formatCompactStandalone}
                />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Data: ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <CategoryPieCharts
        transactions={transactions}
        formatCurrency={formatCurrency}
      />
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export const CashFlowTabsContent = memo(function CashFlowTabsContent({
  activeTab,
  onTabChange,
  dailyData,
  weeklyData,
  monthlyData,
  transactions,
  comparisonData,
  formatCurrency,
  saldoInicial,
  startDate,
  endDate,
  periodLabel,
}: CashFlowTabsContentProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid grid-cols-6 w-full h-auto gap-0.5 p-0.5 sm:p-1 bg-muted/80">
        {tabsConfig.map(({ value, icon: Icon, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="relative py-2 sm:py-2.5 px-1 sm:px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-colors"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center gap-1.5">
                  <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline text-xs">{label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sm:hidden">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Matrix Tab */}
      <TabsContent value="matriz" className="mt-0">
        <AnimatePresence mode="wait">
          {activeTab === "matriz" && (
            <motion.div key="matriz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Suspense fallback={<TabSkeleton />}>
                <CashFlowMatrixView
                  weeklyData={weeklyData}
                  dailyData={dailyData}
                  detailedTransactions={transactions}
                  formatCurrency={formatCurrency}
                  saldoInicial={saldoInicial}
                  startDate={startDate}
                  endDate={endDate}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      {/* Chart Tab */}
      <TabsContent value="grafico" className="mt-0">
        <AnimatePresence mode="wait">
          {activeTab === "grafico" && (
            <motion.div key="grafico" {...motionConfig}>
              <ChartTabContent
                dailyData={dailyData}
                transactions={transactions}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      {/* Daily Tab */}
      <TabsContent value="diario" className="mt-0">
        <AnimatePresence mode="wait">
          {activeTab === "diario" && (
            <motion.div key="diario" {...motionConfig}>
              <DailyView
                dailyData={dailyData}
                formatCurrency={formatCurrency}
                saldoInicial={saldoInicial}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      {/* Weekly Tab */}
      <TabsContent value="semanal" className="mt-0">
        <AnimatePresence mode="wait">
          {activeTab === "semanal" && (
            <motion.div key="semanal" {...motionConfig}>
              <WeeklyView
                weeklyData={weeklyData}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      {/* Monthly Tab */}
      <TabsContent value="mensal" className="mt-0">
        <AnimatePresence mode="wait">
          {activeTab === "mensal" && (
            <motion.div key="mensal" {...motionConfig}>
              <MonthlyView
                monthlyData={monthlyData}
                formatCurrency={formatCurrency}
                periodLabel={periodLabel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      {/* Comparison Tab */}
      <TabsContent value="comparativo" className="mt-0">
        <AnimatePresence mode="wait">
          {activeTab === "comparativo" && (
            <motion.div key="comparativo" {...motionConfig}>
              <ComparisonView
                data={comparisonData}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>
    </Tabs>
  );
});
