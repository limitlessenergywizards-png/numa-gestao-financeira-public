'use client';


import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debtPayoffPlanner, PayoffStrategy } from '../services/debtPayoffPlanner';
import { Debt } from '../services/debtCalculationEngine';
import { formatCurrency } from '@/lib/utils';
import { differenceInMonths, format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, TrendingDown, Snowflake, Mountain } from 'lucide-react';

export function PayoffPlanner() {
    const [strategy, setStrategy] = useState<PayoffStrategy>('avalanche');
    const [extraPayment, setExtraPayment] = useState<number>(500);

    const { data: debts, isLoading } = useQuery({
        queryKey: ['debts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('debts')
                .select('id, company_id, name, description, creditor_name, creditor_type, debt_type, original_amount, current_balance, paid_amount, paid_installments, status, interest_rate, interest_period, interest_type, total_installments, installment_amount, due_day, contract_date, first_due_date, paid_off_at, priority_score, created_at, updated_at')
                .neq('current_balance', 0) // Only active debts
                .order('interest_rate', { ascending: false });

            if (error) throw error;
            return data as Debt[];
        }
    });

    const simulation = useMemo(() => {
        if (!debts || debts.length === 0) return null;
        return debtPayoffPlanner.simulatePayoff(debts, extraPayment, strategy);
    }, [debts, extraPayment, strategy]);

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!debts || debts.length === 0) return <div className="text-center p-8">Nenhuma dívida encontrada para simulação.</div>;

    const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Controls */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Configurar Plano</CardTitle>
                        <CardDescription>Simule cenários de quitação</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Estratégia</Label>
                            <Select value={strategy} onValueChange={(v) => setStrategy(v as PayoffStrategy)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="avalanche">
                                        <div className="flex items-center gap-2">
                                            <Mountain className="w-4 h-4 text-red-500" />
                                            <span>Avalanche (Juros Altos)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="snowball">
                                        <div className="flex items-center gap-2">
                                            <Snowflake className="w-4 h-4 text-blue-500" />
                                            <span>Bola de Neve (Menor Saldo)</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {strategy === 'avalanche'
                                    ? 'Prioriza dívidas com juros mais altos. Matematicamente mais eficiente (economiza mais dinheiro).'
                                    : 'Prioriza dívidas menores. Psicologicamente motivador (elimina dívidas mais rápido).'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Pagamento Extra Mensal</Label>
                                <span className="font-bold text-green-600">{formatCurrency(extraPayment)}</span>
                            </div>
                            <Slider
                                value={[extraPayment]}
                                onValueChange={(v) => setExtraPayment(v[0])}
                                max={5000}
                                step={50}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setExtraPayment(0)}>R$ 0</Button>
                                <Button variant="outline" size="sm" onClick={() => setExtraPayment(500)}>500</Button>
                                <Button variant="outline" size="sm" onClick={() => setExtraPayment(1000)}>1k</Button>
                                <Button variant="outline" size="sm" onClick={() => setExtraPayment(2000)}>2k</Button>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="text-sm font-medium mb-2">Resumo da Simulação</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Dívida Total</span>
                                    <span className="font-bold">{formatCurrency(totalDebt)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Mês Final</span>
                                    <span className="font-bold text-indigo-600">
                                        {simulation ? format(simulation.debtFreeDate, 'MMM/yyyy') : '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Tempo Total</span>
                                    <span className="font-bold">
                                        {simulation ? simulation.totalMonths : 0} meses
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Juros Pagos</span>
                                    <span className="font-bold text-red-500">
                                        {simulation ? formatCurrency(simulation.totalInterestPaid) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Chart */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Projeção de Saldo Devedor</CardTitle>
                        <CardDescription>
                            Evolução da dívida com pagamento extra de {formatCurrency(extraPayment)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {simulation && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulation.projection} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="monthLabel"
                                        tick={{ fontSize: 12 }}
                                        interval={Math.ceil(simulation.projection.length / 12)} // Show roughly 1 tick per year if many months
                                    />
                                    <YAxis tickFormatter={(val) => `R$${val / 1000}k`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="totalBalance"
                                        stroke="#ef4444"
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                        name="Saldo Devedor"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
