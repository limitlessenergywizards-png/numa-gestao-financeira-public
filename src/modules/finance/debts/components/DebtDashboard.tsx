
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { AlertTriangle, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Debt, debtCalculationEngine } from '../services/debtCalculationEngine';
import { AnimatedNumber } from '@/modules/home/components/AnimatedNumber';

export function DebtDashboard() {
    const { currentCompany } = useCompany();

    const { data: debts, isLoading } = useQuery({
        queryKey: ['debts', currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany) return [];
            const { data, error } = await supabase
                .from('debts')
                .select('id, company_id, name, description, creditor_name, creditor_type, debt_type, original_amount, current_balance, paid_amount, paid_installments, status, interest_rate, interest_period, interest_type, total_installments, installment_amount, due_day, contract_date, first_due_date, paid_off_at, priority_score, created_at, updated_at')
                .eq('company_id', currentCompany.id);

            if (error) throw error;
            return data as unknown as Debt[];
        },
        enabled: !!currentCompany
    });

    if (isLoading || !debts) return <div className="h-48 animate-pulse bg-muted rounded-md"></div>;

    const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);

    // Calculate approximate monthly interest burden
    const monthlyInterestBurden = debts.reduce((sum, d) => {
        const monthlyRate = debtCalculationEngine.convertToMonthlyRate(d.interest_rate, d.interest_period).toNumber() / 100;
        return sum + (d.current_balance * monthlyRate);
    }, 0);

    // Group by Debt Type for chart
    const debtsByType = debts.reduce((acc, debt) => {
        const type = debt.debt_type.replace(/_/g, ' ');
        acc[type] = (acc[type] || 0) + debt.current_balance;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(debtsByType).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // High interest alert
    const highInterestDebts = debts.filter(d =>
        debtCalculationEngine.convertToMonthlyRate(d.interest_rate, d.interest_period).toNumber() > 5
    ).length;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                        <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white/5" />
                        <CardContent className="p-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/80">Dívida Total</p>
                                    <p className="text-2xl font-bold text-white">
                                        <AnimatedNumber value={totalDebt} prefix="R$" />
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                        <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white/5" />
                        <CardContent className="p-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/80">Juros Mensais (Est.)</p>
                                    <p className="text-2xl font-bold text-white">
                                        <AnimatedNumber value={monthlyInterestBurden} prefix="R$" />
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <TrendingDown className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                        <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white/5" />
                        <CardContent className="p-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/80">Dívidas Ativas</p>
                                    <p className="text-2xl font-bold text-white">
                                        {debts.length}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* High Interest Alert */}
            {highInterestDebts > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Cuidado: Juros Altos Detectados</AlertTitle>
                    <AlertDescription>
                        Você possui <strong>{highInterestDebts}</strong> dívida(s) com taxa de juros acima de 5% ao mês.
                        Recomendamos priorizar a quitação destas dívidas para evitar o efeito "bola de neve".
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Composição da Dívida</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Distribuição por Credor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Placeholder lists for Creditors */}
                            {Object.entries(
                                debts.reduce((acc, d) => {
                                    acc[d.creditor_name] = (acc[d.creditor_name] || 0) + d.current_balance;
                                    return acc
                                }, {} as Record<string, number>)
                            ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([creditor, total], i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/60 dark:bg-muted/50 rounded-lg border border-border/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                                            {creditor.substring(0, 2)}
                                        </div>
                                        <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{creditor}</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{formatCurrency(total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
