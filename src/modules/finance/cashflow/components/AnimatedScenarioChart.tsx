import {
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  week: string;
  otimista: number;
  realista: number;
  pessimista: number;
}

type ScenarioType = 'optimistic' | 'realistic' | 'pessimistic';

interface AnimatedScenarioChartProps {
  data: ChartDataPoint[];
  selectedScenario: ScenarioType;
  formatCurrency: (value: number) => string;
  currentBalance?: number;
  className?: string;
}

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

export function AnimatedScenarioChart({ 
  data, 
  selectedScenario, 
  formatCurrency, 
  currentBalance,
  className 
}: AnimatedScenarioChartProps) {
  return (
    <div
      className={cn("h-[180px] xs:h-[220px] sm:h-[280px] animate-fade-in", className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOptimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gradRealistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gradPessimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          
          {currentBalance !== undefined && (
            <ReferenceLine 
              y={currentBalance} 
              stroke="#6366f1" 
              strokeDasharray="5 5" 
              label={{ 
                value: "Atual", 
                fontSize: 9,
                fill: "#6366f1",
                position: "insideTopRight"
              }} 
            />
          )}
          
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 9 }} 
            interval={0}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fontSize: 9 }} 
            tickFormatter={formatCompact} 
            width={40}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: 'var(--foreground)', fontSize: 11 }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 11,
              padding: '6px 10px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 10, paddingTop: 5 }}
            iconSize={8}
          />
          
          <Area 
            type="monotone" 
            dataKey="otimista" 
            name="Otimista"
            stroke="#10b981" 
            fill="url(#gradOptimistic)"
            strokeWidth={selectedScenario === 'optimistic' ? 2.5 : 1}
            opacity={selectedScenario === 'optimistic' ? 1 : 0.35}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Area 
            type="monotone" 
            dataKey="realista" 
            name="Realista"
            stroke="#f59e0b" 
            fill="url(#gradRealistic)"
            strokeWidth={selectedScenario === 'realistic' ? 2.5 : 1}
            opacity={selectedScenario === 'realistic' ? 1 : 0.35}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Area 
            type="monotone" 
            dataKey="pessimista" 
            name="Pessimista"
            stroke="#ef4444" 
            fill="url(#gradPessimistic)"
            strokeWidth={selectedScenario === 'pessimistic' ? 2.5 : 1}
            opacity={selectedScenario === 'pessimistic' ? 1 : 0.35}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
