import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";

interface BreakEvenChartProps {
    breakEvenPoint: number;
    fixedCosts: number;
    variableCosts: number;
    totalRevenue: number;
}

export function BreakEvenChart({ breakEvenPoint, fixedCosts, variableCosts, totalRevenue }: BreakEvenChartProps) {
    // Generate data points for the visualization
    // Point 0: Revenue 0
    // Point 1: Break Even
    // Point 2: Current Status (or slightly beyond for projection)

    // We want the chart to extend a bit beyond the max of BEP and TotalRevenue
    const maxX = Math.max(breakEvenPoint, totalRevenue) * 1.2;

    // Logic for Total Cost line: Fixed + (Variable/Revenue * X)
    // Variable cost ratio
    const variableRatio = totalRevenue > 0 ? variableCosts / totalRevenue : 0;

    const data = [
        {
            x: 0,
            revenue: 0,
            fixedCosts: fixedCosts,
            totalCosts: fixedCosts,
        },
        {
            x: breakEvenPoint,
            revenue: breakEvenPoint,
            fixedCosts: fixedCosts,
            totalCosts: breakEvenPoint, // At BEP, Total Costs = Revenue
        },
        {
            x: maxX,
            revenue: maxX,
            fixedCosts: fixedCosts,
            totalCosts: fixedCosts + (variableRatio * maxX),
        }
    ].sort((a, b) => a.x - b.x);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Faturamento</span>
                            <span className="font-bold text-muted-foreground">{formatCurrency(Number(label))}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-[#10b981]">Receita</span>
                            <span className="font-bold text-[#10b981]">{formatCurrency(payload[0].value)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-[#f97316]">Custo Total</span>
                            <span className="font-bold text-[#f97316]">{formatCurrency(payload[2].value)}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Análise do Ponto de Equilíbrio</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="x"
                                type="number"
                                domain={[0, maxX]}
                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                            />
                            <YAxis
                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {/* Fixed Costs Line */}
                            <Line
                                type="monotone"
                                dataKey="fixedCosts"
                                stroke="#ef4444"
                                strokeDasharray="5 5"
                                name="Custos Fixos"
                                dot={false}
                            />

                            {/* Total Costs Line */}
                            <Line
                                type="monotone"
                                dataKey="totalCosts"
                                stroke="#f97316"
                                strokeWidth={2}
                                name="Custo Total"
                                dot={false}
                            />

                            {/* Revenue Line */}
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Receita"
                                dot={false}
                            />

                            {/* Break Even Marker */}
                            <ReferenceLine
                                x={breakEvenPoint}
                                stroke="#6366f1"
                                strokeDasharray="3 3"
                                label={{ value: 'Ponto de Equilíbrio', position: 'insideTopLeft', fill: '#6366f1', fontSize: 12 }}
                            />

                            {/* Current Revenue Marker */}
                            <ReferenceLine
                                x={totalRevenue}
                                stroke="#10b981"
                                label={{ value: 'Atual', position: 'insideBottomRight', fill: '#10b981', fontSize: 12 }}
                            />

                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-destructive font-medium">Custos Fixos</p>
                        <p className="text-xl font-bold">{formatCurrency(fixedCosts)}</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Ponto de Equilíbrio</p>
                        <p className="text-xl font-bold">{formatCurrency(breakEvenPoint)}</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Margem de Segurança</p>
                        <p className="text-xl font-bold">{totalRevenue > breakEvenPoint ? formatCurrency(totalRevenue - breakEvenPoint) : 'R$ 0,00'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
