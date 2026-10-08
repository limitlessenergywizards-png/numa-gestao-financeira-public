/**
 * StrategicCharts
 *
 * Chart cards for the Advanced Reports page:
 * Gauge performance, Waterfall DRE, Sankey flow,
 * 12-month trend, Aging report, Budget vs Actual.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  BarChart3,
  Scale,
} from 'lucide-react';
import {
  Bar,
  Cell,
  Line,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Sankey,
  Area,
  AreaChart,
} from 'recharts';
import { GaugeChart } from '@/modules/analytics/dashboard/components/GaugeChart';

interface StrategicData {
  isLoading: boolean;
  margemLiquida: number;
  liquidezCorrente: number;
  indiceEndividamento: number;
  margemContribuicaoPct: number;
  agingBuckets: {
    d1_15: number;
    d16_30: number;
    d31_60: number;
    d60plus: number;
  };
}

interface ChartDataShape {
  isLoading: boolean;
  hasData: boolean;
  waterfall: Array<{ name: string; range: [number, number]; fill: string }>;
  sankey: { nodes: { name: string }[]; links: { source: number; target: number; value: number }[] };
  trend: { month: string; receita: number; despesa: number; lucro: number }[];
  budgetVsActual: { name: string; orcado: number; realizado: number }[];
}

interface StrategicChartsProps {
  strategic: StrategicData;
  chartData: ChartDataShape;
  formatCurrency: (value: number) => string;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  color: 'hsl(var(--foreground))',
};
const TOOLTIP_LABEL_STYLE = { color: 'hsl(var(--foreground))', fontWeight: 600 };
const TOOLTIP_ITEM_STYLE = { color: 'hsl(var(--foreground))' };

export function StrategicCharts({ strategic, chartData, formatCurrency }: StrategicChartsProps) {
  return (
    <>
      {/* Gauges */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Medidores de Performance
          </CardTitle>
          <CardDescription>
            Visão instantânea dos principais índices financeiros — regra dos 5 segundos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {strategic.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <GaugeChart
                value={Math.min(Math.max(strategic.margemLiquida, 0), 100)}
                max={100}
                label="Margem Líquida"
                status={strategic.margemLiquida >= 15 ? 'success' : strategic.margemLiquida >= 5 ? 'warning' : 'danger'}
                suffix="%"
              />
              <GaugeChart
                value={Math.min(strategic.liquidezCorrente * 50, 100)}
                max={100}
                label="Liquidez Corrente"
                status={strategic.liquidezCorrente >= 1.5 ? 'success' : strategic.liquidezCorrente >= 1 ? 'warning' : 'danger'}
                showPercentage={false}
                suffix={` (${strategic.liquidezCorrente.toFixed(2)})`}
              />
              <GaugeChart
                value={Math.min(strategic.indiceEndividamento, 100)}
                max={100}
                label="Endividamento"
                status={strategic.indiceEndividamento <= 50 ? 'success' : strategic.indiceEndividamento <= 80 ? 'warning' : 'danger'}
                suffix="%"
              />
              <GaugeChart
                value={Math.min(Math.max(strategic.margemContribuicaoPct, 0), 100)}
                max={100}
                label="Margem Contribuição"
                status={strategic.margemContribuicaoPct >= 40 ? 'success' : strategic.margemContribuicaoPct >= 20 ? 'warning' : 'danger'}
                suffix="%"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waterfall DRE */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Cascata DRE — Decomposição do Resultado
          </CardTitle>
          <CardDescription>
            Como a receita se transforma em lucro no mês corrente (Receita → Despesas → Lucro)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !chartData.hasData ? (
            <div className="flex items-center justify-center h-72 text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Sem dados de movimentações para o mês corrente</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.waterfall} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                  formatter={(value: number) => [formatCurrency(Math.abs(value)), 'Valor']}
                />
                <Bar dataKey="range" radius={[4, 4, 0, 0]} barSize={60}>
                  {chartData.waterfall.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sankey */}
      {chartData.sankey.links.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              Fluxo de Recursos — Distribuição da Receita
            </CardTitle>
            <CardDescription>
              Como a receita se distribui entre categorias de despesa e lucro final
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <Sankey
                  data={chartData.sankey}
                  node={{ fill: 'hsl(var(--primary))' }}
                  link={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.2 }}
                  nodePadding={30}
                  margin={{ top: 10, right: 80, left: 10, bottom: 10 }}
                >
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                </Sankey>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* 12-month Trend */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Tendência de 12 Meses
          </CardTitle>
          <CardDescription>
            Evolução mensal de receitas, despesas e lucro — identifique sazonalidades e tendências
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !chartData.hasData ? (
            <div className="flex items-center justify-center h-72 text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Sem dados históricos</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'receita' ? 'Receita' : name === 'despesa' ? 'Despesas' : 'Lucro',
                  ]}
                />
                <Legend formatter={(v) => v === 'receita' ? 'Receita' : v === 'despesa' ? 'Despesas' : 'Lucro'} />
                <Area type="monotone" dataKey="receita" stroke="hsl(142, 76%, 36%)" fill="url(#gradReceita)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="despesa" stroke="hsl(0, 84%, 55%)" fill="url(#gradDespesa)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="lucro" stroke="hsl(217, 91%, 60%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Aging Report */}
      {(strategic.agingBuckets.d1_15 > 0 || strategic.agingBuckets.d16_30 > 0 || strategic.agingBuckets.d31_60 > 0 || strategic.agingBuckets.d60plus > 0) && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              Aging Report — Envelhecimento da Dívida
            </CardTitle>
            <CardDescription>
              Distribuição dos recebíveis vencidos por faixas de atraso — identifique risco de inadimplência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { faixa: 'D+1 a D+15', valor: strategic.agingBuckets.d1_15, fill: 'hsl(45, 93%, 47%)' },
                  { faixa: 'D+16 a D+30', valor: strategic.agingBuckets.d16_30, fill: 'hsl(25, 95%, 53%)' },
                  { faixa: 'D+31 a D+60', valor: strategic.agingBuckets.d31_60, fill: 'hsl(0, 84%, 60%)' },
                  { faixa: 'D+60+', valor: strategic.agingBuckets.d60plus, fill: 'hsl(0, 72%, 45%)' },
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="faixa" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                  formatter={(value: number) => [formatCurrency(value), 'Valor Vencido']}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={50}>
                  {[
                    { fill: 'hsl(45, 93%, 47%)' },
                    { fill: 'hsl(25, 95%, 53%)' },
                    { fill: 'hsl(0, 84%, 60%)' },
                    { fill: 'hsl(0, 72%, 45%)' },
                  ].map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Budget vs Actual */}
      {chartData.budgetVsActual.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Scale className="h-4 w-4 text-white" />
              </div>
              Orçado vs. Realizado
            </CardTitle>
            <CardDescription>
              Disciplina financeira por categoria — compare o planejamento com a execução real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.budgetVsActual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'orcado' ? 'Orçado' : 'Realizado',
                    ]}
                  />
                  <Legend formatter={(v) => v === 'orcado' ? 'Orçado' : 'Realizado'} />
                  <Bar dataKey="orcado" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="realizado" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
