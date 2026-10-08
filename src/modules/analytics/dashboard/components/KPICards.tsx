import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  ArrowUp,
  ArrowDown 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  format?: "percent" | "currency" | "months" | "ratio";
  currencySymbol?: string;
  icon: React.ReactNode;
  trend?: number;
  status?: "success" | "warning" | "danger" | "neutral";
  description?: string;
  showGauge?: boolean;
  gaugeMax?: number;
}

function KPIGauge({ value, max, status }: { value: number; max: number; status?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (status === "success") return "bg-success";
    if (status === "warning") return "bg-warning";
    if (status === "danger") return "bg-destructive";
    return "bg-primary";
  };

  return (
    <div className="relative w-full mt-3">
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function KPICard({
  title,
  value,
  format = "ratio",
  currencySymbol = "R$",
  icon,
  trend,
  status = "neutral",
  description,
  showGauge = false,
  gaugeMax = 2,
}: KPICardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case "percent":
        return `${val.toFixed(1)}%`;
      case "currency":
        return `${currencySymbol} ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      case "months":
        return `${val.toFixed(1)} meses`;
      case "ratio":
      default:
        return val.toFixed(2);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case "success":
        return "bg-success/10";
      case "warning":
        return "bg-warning/10";
      case "danger":
        return "bg-destructive/10";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="card-hover overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110", getStatusBgColor())}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-bold", getStatusColor())}>
            {formatValue(value)}
          </span>
          {trend !== undefined && (
            <Badge variant="secondary" className={cn(
              "text-xs",
              trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : ""
            )}>
              {trend > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {showGauge && (
          <KPIGauge value={value} max={gaugeMax} status={status} />
        )}
      </CardContent>
    </Card>
  );
}

interface KPIData {
  liquidez: number;
  margem: number;
  inadimplencia: number;
  cobertura: number;
  trends?: {
    liquidez?: number;
    margem?: number;
    inadimplencia?: number;
    cobertura?: number;
  };
}

interface KPICardsGridProps {
  data: KPIData;
  currencySymbol?: string;
  isLoading?: boolean;
}

export function KPICardsGrid({ data, currencySymbol = "R$", isLoading }: KPICardsGridProps) {
  const getLiquidezStatus = (val: number): "success" | "warning" | "danger" => {
    if (val >= 1.5) return "success";
    if (val >= 1) return "warning";
    return "danger";
  };

  const getMargemStatus = (val: number): "success" | "warning" | "danger" => {
    if (val >= 15) return "success";
    if (val >= 5) return "warning";
    return "danger";
  };

  const getInadimplenciaStatus = (val: number): "success" | "warning" | "danger" => {
    if (val <= 5) return "success";
    if (val <= 15) return "warning";
    return "danger";
  };

  const getCoberturaStatus = (val: number): "success" | "warning" | "danger" => {
    if (val >= 3) return "success";
    if (val >= 1) return "warning";
    return "danger";
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-10 bg-muted rounded-xl" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Liquidez Corrente"
        value={data.liquidez}
        format="ratio"
        icon={<Droplets className={cn("h-5 w-5", getLiquidezStatus(data.liquidez) === "success" ? "text-success" : getLiquidezStatus(data.liquidez) === "warning" ? "text-warning" : "text-destructive")} />}
        status={getLiquidezStatus(data.liquidez)}
        description={data.liquidez >= 1 ? "Capacidade de pagar dívidas" : "Atenção: baixa liquidez"}
        showGauge
        gaugeMax={3}
        trend={data.trends?.liquidez}
      />
      <KPICard
        title="Margem Operacional"
        value={data.margem}
        format="percent"
        icon={<TrendingUp className={cn("h-5 w-5", getMargemStatus(data.margem) === "success" ? "text-success" : getMargemStatus(data.margem) === "warning" ? "text-warning" : "text-destructive")} />}
        status={getMargemStatus(data.margem)}
        description="Lucro sobre receita"
        trend={data.trends?.margem}
      />
      <KPICard
        title="Inadimplência"
        value={data.inadimplencia}
        format="percent"
        icon={<AlertTriangle className={cn("h-5 w-5", getInadimplenciaStatus(data.inadimplencia) === "success" ? "text-success" : getInadimplenciaStatus(data.inadimplencia) === "warning" ? "text-warning" : "text-destructive")} />}
        status={getInadimplenciaStatus(data.inadimplencia)}
        description="Recebíveis vencidos"
        trend={data.trends?.inadimplencia}
      />
      <KPICard
        title="Cobertura de Caixa"
        value={data.cobertura}
        format="months"
        icon={<Shield className={cn("h-5 w-5", getCoberturaStatus(data.cobertura) === "success" ? "text-success" : getCoberturaStatus(data.cobertura) === "warning" ? "text-warning" : "text-destructive")} />}
        status={getCoberturaStatus(data.cobertura)}
        description="Meses de operação garantidos"
        showGauge
        gaugeMax={6}
        trend={data.trends?.cobertura}
      />
    </div>
  );
}
