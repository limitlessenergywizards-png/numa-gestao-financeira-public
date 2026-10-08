import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthSituationCardProps {
  receivablesProjection: number;
  receivablesReceived: number;
  payablesProjection: number;
  payablesPaid: number;
  currencySymbol: string;
  loading?: boolean;
}

export function MonthSituationCard({
  receivablesProjection,
  receivablesReceived,
  payablesProjection,
  payablesPaid,
  currencySymbol,
  loading = false,
}: MonthSituationCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Situação no mês atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <div className="pt-3 border-t text-center space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-8 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const receivablesPercent = receivablesProjection > 0
    ? Math.min((receivablesReceived / receivablesProjection) * 100, 100)
    : 0;
  const payablesPercent = payablesProjection > 0
    ? Math.min((payablesPaid / payablesProjection) * 100, 100)
    : 0;

  const netProfit = receivablesProjection - payablesProjection;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Situação no mês atual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Receivables Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projeção de recebimentos</span>
            <span className="font-medium text-success">
              {currencySymbol} {formatCurrency(receivablesProjection)}
            </span>
          </div>
          <Progress
            value={receivablesPercent}
            className="h-3 bg-success/20 [&>div]:bg-success"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Recebido: {currencySymbol} {formatCurrency(receivablesReceived)}</span>
            <span>{receivablesPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Payables Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projeção de pagamentos</span>
            <span className="font-medium text-warning">
              {currencySymbol} {formatCurrency(payablesProjection)}
            </span>
          </div>
          <Progress
            value={payablesPercent}
            className="h-3 bg-warning/20 [&>div]:bg-warning"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pago: {currencySymbol} {formatCurrency(payablesPaid)}</span>
            <span>{payablesPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="pt-3 border-t text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Projeção de lucro líquido até o final do mês
          </p>
          <h2 className={`text-2xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {currencySymbol} {formatCurrency(netProfit)}
          </h2>
        </div>
      </CardContent>
    </Card>
  );
}
