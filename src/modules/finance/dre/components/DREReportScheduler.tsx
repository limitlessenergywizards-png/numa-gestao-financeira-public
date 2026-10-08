'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Calendar, 
  Plus, 
  Trash2, 
  Settings, 
  Clock,
  FileText,
  FileSpreadsheet,
  Check,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addMonths, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DREReportSchedule {
  id: string;
  company_id: string;
  created_by: string;
  recipient_emails: string[];
  schedule_type: string;
  day_of_month: number;
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  include_pdf: boolean;
  include_excel: boolean;
  report_period: string;
  created_at: string;
}

interface DREReportSchedulerProps {
  companyId: string;
}

export function DREReportScheduler({ companyId }: DREReportSchedulerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DREReportSchedule | null>(null);

  // Form state
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState(5);
  const [includePdf, setIncludePdf] = useState(true);
  const [includeExcel, setIncludeExcel] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("previous_month");

  // Fetch existing schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["dre-schedules", companyId],
    queryFn: async (): Promise<DREReportSchedule[]> => {
      const { data, error } = await supabase
        .from("dre_report_schedules")
        .select("id, company_id, created_by, recipient_emails, schedule_type, day_of_month, is_active, last_sent_at, next_send_at, include_pdf, include_excel, report_period, created_at")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DREReportSchedule[];
    },
    enabled: !!companyId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<DREReportSchedule>) => {
      const nextSendDate = calculateNextSendDate(data.day_of_month || 5);
      
      if (editingSchedule) {
        const { error } = await supabase
          .from("dre_report_schedules")
          .update({
            ...data,
            next_send_at: nextSendDate.toISOString(),
          })
          .eq("id", editingSchedule.id)
          .eq("company_id", companyId);
        if (error) throw error;
      } else {
        const insertData = {
          recipient_emails: data.recipient_emails || [],
          day_of_month: data.day_of_month || 5,
          include_pdf: data.include_pdf ?? true,
          include_excel: data.include_excel ?? false,
          report_period: data.report_period || "previous_month",
          schedule_type: data.schedule_type || "monthly",
          is_active: data.is_active ?? true,
          company_id: companyId,
          created_by: user?.id || "",
          next_send_at: nextSendDate.toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from("dre_report_schedules").insert(insertData as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-schedules", companyId] });
      toast.success(editingSchedule ? "Agendamento atualizado!" : "Agendamento criado!");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error("Error saving schedule:", error);
      toast.error("Erro ao salvar agendamento");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dre_report_schedules")
        .update({ is_active: false })
        .eq("id", id)
        .eq("company_id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-schedules", companyId] });
      toast.success("Agendamento excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir agendamento");
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("dre_report_schedules")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("company_id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-schedules", companyId] });
    },
  });

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      return callEdgeFunction(EDGE_FUNCTIONS.SEND_DRE_REPORT, {
        body: { scheduleId, manual: true },
        fallbackMessage: "Erro ao enviar email de teste",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-schedules", companyId] });
      queryClient.invalidateQueries({ queryKey: ["dre-email-logs", companyId] });
      toast.success("Email de teste enviado com sucesso!");
    },
    onError: (error) => {
      console.error("Error sending test email:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar email de teste");
    },
  });

  const calculateNextSendDate = (day: number) => {
    const now = new Date();
    let nextDate = setDate(now, day);
    if (nextDate <= now) {
      nextDate = setDate(addMonths(now, 1), day);
    }
    return nextDate;
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && !emails.includes(email) && email.includes("@")) {
      setEmails([...emails, email]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleOpenDialog = (schedule?: DREReportSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setEmails(schedule.recipient_emails);
      setDayOfMonth(schedule.day_of_month);
      setIncludePdf(schedule.include_pdf);
      setIncludeExcel(schedule.include_excel);
      setReportPeriod(schedule.report_period);
    } else {
      setEditingSchedule(null);
      setEmails([]);
      setDayOfMonth(5);
      setIncludePdf(true);
      setIncludeExcel(false);
      setReportPeriod("previous_month");
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSchedule(null);
    setEmails([]);
    setNewEmail("");
  };

  const handleSubmit = () => {
    if (emails.length === 0) {
      toast.error("Adicione pelo menos um email");
      return;
    }

    saveMutation.mutate({
      recipient_emails: emails,
      day_of_month: dayOfMonth,
      include_pdf: includePdf,
      include_excel: includeExcel,
      report_period: reportPeriod,
      schedule_type: "monthly",
      is_active: true,
    });
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      previous_month: "Mês Anterior",
      current_month: "Mês Atual",
      quarter: "Trimestre",
    };
    return labels[period] || period;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Exportação Automática por Email
            </CardTitle>
            <CardDescription>
              Receba o DRE automaticamente no seu email todo mês
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? "Editar Agendamento" : "Novo Agendamento"}
                </DialogTitle>
                <DialogDescription>
                  Configure o envio automático do relatório DRE
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Email recipients */}
                <div className="space-y-2">
                  <Label>Destinatários</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddEmail}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {emails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {emails.map((email) => (
                        <Badge key={email} variant="secondary" className="gap-1">
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Day of month */}
                <div className="space-y-2">
                  <Label>Dia do Envio</Label>
                  <Select value={String(dayOfMonth)} onValueChange={(v) => setDayOfMonth(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          Dia {day} de cada mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Report period */}
                <div className="space-y-2">
                  <Label>Período do Relatório</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous_month">Mês Anterior</SelectItem>
                      <SelectItem value="current_month">Mês Atual</SelectItem>
                      <SelectItem value="quarter">Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format options */}
                <div className="space-y-3">
                  <Label>Formatos</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="text-sm">PDF</span>
                    </div>
                    <Switch checked={includePdf} onCheckedChange={setIncludePdf} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Excel</span>
                    </div>
                    <Switch checked={includeExcel} onCheckedChange={setIncludeExcel} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {schedules && schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  schedule.is_active ? "bg-muted/30" : "bg-muted/10 opacity-60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={schedule.is_active ? "default" : "secondary"}>
                      {schedule.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Dia {schedule.day_of_month} • {getPeriodLabel(schedule.report_period)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">
                      {schedule.recipient_emails.join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    {schedule.include_pdf && (
                      <span className="flex items-center gap-1 text-red-500">
                        <FileText className="h-3 w-3" /> PDF
                      </span>
                    )}
                    {schedule.include_excel && (
                      <span className="flex items-center gap-1 text-green-500">
                        <FileSpreadsheet className="h-3 w-3" /> Excel
                      </span>
                    )}
                    {schedule.next_send_at && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Próximo: {format(new Date(schedule.next_send_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <Switch
                    checked={schedule.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: schedule.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenDialog(schedule)}
                    aria-label="Configurar agendamento"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary"
                    onClick={() => sendTestMutation.mutate(schedule.id)}
                    disabled={sendTestMutation.isPending}
                    title="Enviar email de teste"
                    aria-label="Enviar email de teste"
                  >
                    {sendTestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(schedule.id)}
                    aria-label="Excluir agendamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum agendamento configurado</p>
            <p className="text-xs mt-1">
              Configure o envio automático do DRE para seu email
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
