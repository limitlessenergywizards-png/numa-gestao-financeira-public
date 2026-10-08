import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EmailLog {
  id: string;
  schedule_id: string;
  company_id: string;
  sent_at: string;
  recipient_emails: string[];
  status: string;
  resend_id: string | null;
  error_message: string | null;
  opened_at: string | null;
  report_period: string | null;
}

interface DREEmailMetricsProps {
  companyId: string;
}

export function DREEmailMetrics({ companyId }: DREEmailMetricsProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["dre-email-logs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dre_email_logs")
        .select("id, schedule_id, company_id, sent_at, recipient_emails, status, resend_id, error_message, opened_at, report_period")
        .eq("company_id", companyId)
        .order("sent_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalSent = logs?.length || 0;
  const successCount = logs?.filter(l => l.status === "sent" || l.status === "delivered").length || 0;
  const failedCount = logs?.filter(l => l.status === "failed" || l.status === "bounced").length || 0;
  const successRate = totalSent > 0 ? ((successCount / totalSent) * 100).toFixed(1) : "0";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        );
      case "failed":
      case "bounced":
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      case "opened":
        return (
          <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aberto
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Métricas de Email
        </CardTitle>
        <CardDescription>
          Histórico de envios e taxa de entrega dos relatórios
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{totalSent}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Enviados</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-green-500/10 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{successCount}</div>
            <div className="text-xs sm:text-sm text-green-600/80 mt-1">Sucesso</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{failedCount}</div>
            <div className="text-xs sm:text-sm text-red-600/80 mt-1">Falhas</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-primary/10 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-2xl sm:text-3xl font-bold text-primary">{successRate}%</span>
            </div>
            <div className="text-xs sm:text-sm text-primary/80 mt-1">Taxa Sucesso</div>
          </div>
        </div>

        {/* Email History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Histórico de Envios</h4>
          
          {logs && logs.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    log.status === "failed" || log.status === "bounced" 
                      ? "bg-red-500/5 border-red-500/20" 
                      : "bg-muted/30"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {log.recipient_emails.join(", ")}
                      </span>
                    </div>
                    {log.error_message && (
                      <div className="mt-1 text-xs text-red-500 truncate">
                        Erro: {log.error_message}
                      </div>
                    )}
                    {log.report_period && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Período: {log.report_period}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(log.sent_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum email enviado ainda</p>
              <p className="text-xs mt-1">
                Os envios aparecerão aqui após serem processados
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
