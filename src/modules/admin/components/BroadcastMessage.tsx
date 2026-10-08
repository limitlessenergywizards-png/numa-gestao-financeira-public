'use client';

import { useState } from "react";
import {
  Send,
  Bell,
  Mail,
  Users,
  Building2,
  Calendar,
  FileText,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AdminUser, AdminCompany } from "@/modules/admin/hooks/useAdminData";

interface BroadcastMessageProps {
  users: AdminUser[];
  companies: AdminCompany[];
}

type MessageType = 'notification' | 'email';
type TargetType = 'all' | 'segment' | 'companies';

const TEMPLATES = [
  {
    id: 'maintenance',
    name: 'Manutenção Programada',
    subject: 'Aviso de Manutenção',
    content: 'Informamos que haverá uma manutenção programada no sistema no dia [DATA] das [HORA_INICIO] às [HORA_FIM]. Durante este período, o sistema poderá ficar indisponível. Agradecemos a compreensão.',
  },
  {
    id: 'feature',
    name: 'Nova Funcionalidade',
    subject: 'Nova Funcionalidade Disponível',
    content: 'Temos o prazer de anunciar uma nova funcionalidade: [NOME_FUNCIONALIDADE]. Agora você pode [DESCRIÇÃO_BENEFÍCIO]. Acesse sua conta para experimentar!',
  },
  {
    id: 'trial',
    name: 'Trial Expirando',
    subject: 'Seu período de trial está acabando',
    content: 'Seu período de avaliação gratuito está chegando ao fim. Para continuar aproveitando todos os recursos do FL Gestão, assine um de nossos planos e não perca nenhuma funcionalidade.',
  },
];

export function BroadcastMessage({ users, companies }: BroadcastMessageProps) {
  const [messageType, setMessageType] = useState<MessageType>('notification');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const getRecipientCount = () => {
    if (targetType === 'all') return users.length;
    if (targetType === 'segment') {
      return users.filter(u => {
        if (selectedSegments.includes('trial')) {
          const now = new Date();
          if (u.trial_started_at) {
            const trialStart = new Date(u.trial_started_at);
            const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
            return trialEnd > now;
          }
        }
        if (selectedSegments.includes('active')) {
          if (u.last_activity_date) {
            const activityDate = new Date(u.last_activity_date);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return activityDate >= weekAgo;
          }
        }
        if (selectedSegments.includes('inactive')) {
          if (!u.last_activity_date) return true;
          const activityDate = new Date(u.last_activity_date);
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return activityDate < monthAgo;
        }
        return false;
      }).length;
    }
    if (targetType === 'companies') {
      return users.filter(u =>
        u.companies.some(c => selectedCompanies.includes(c.company_id))
      ).length;
    }
    return 0;
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Preencha o assunto e conteúdo da mensagem');
      return;
    }

    const recipientCount = getRecipientCount();
    if (recipientCount === 0) {
      toast.error('Nenhum destinatário selecionado');
      return;
    }

    setIsSending(true);

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success(
      isScheduled
        ? `Mensagem agendada para ${recipientCount} destinatário(s)`
        : `Mensagem enviada para ${recipientCount} destinatário(s)`
    );

    // Reset form
    setSubject('');
    setContent('');
    setSelectedTemplate('');
    setIsSending(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Message Type Selection */}
      <div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-brand" />
              Comunicação em Massa
            </CardTitle>
            <CardDescription>
              Envie notificações ou emails para seus usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-3">
              <Label>Tipo de Mensagem</Label>
              <RadioGroup
                value={messageType}
                onValueChange={(value) => setMessageType(value as MessageType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="notification" id="notification" />
                  <Label htmlFor="notification" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    Notificação In-App
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Target Selection */}
            <div className="space-y-3">
              <Label>Destinatários</Label>
              <RadioGroup
                value={targetType}
                onValueChange={(value) => setTargetType(value as TargetType)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                    Todos ({users.length})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="segment" id="segment" />
                  <Label htmlFor="segment" className="cursor-pointer">Por Segmento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="companies" id="companies" />
                  <Label htmlFor="companies" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    Por Empresa
                  </Label>
                </div>
              </RadioGroup>

              {/* Segment Selection */}
              {targetType === 'segment' && (
                <div className="pl-6 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trial"
                      checked={selectedSegments.includes('trial')}
                      onCheckedChange={(checked) => {
                        setSelectedSegments(prev =>
                          checked
                            ? [...prev, 'trial']
                            : prev.filter(s => s !== 'trial')
                        );
                      }}
                    />
                    <Label htmlFor="trial" className="cursor-pointer">Usuários em Trial</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={selectedSegments.includes('active')}
                      onCheckedChange={(checked) => {
                        setSelectedSegments(prev =>
                          checked
                            ? [...prev, 'active']
                            : prev.filter(s => s !== 'active')
                        );
                      }}
                    />
                    <Label htmlFor="active" className="cursor-pointer">Usuários Ativos (últimos 7 dias)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inactive"
                      checked={selectedSegments.includes('inactive')}
                      onCheckedChange={(checked) => {
                        setSelectedSegments(prev =>
                          checked
                            ? [...prev, 'inactive']
                            : prev.filter(s => s !== 'inactive')
                        );
                      }}
                    />
                    <Label htmlFor="inactive" className="cursor-pointer">Usuários Inativos (+30 dias)</Label>
                  </div>
                </div>
              )}

              {/* Company Selection */}
              {targetType === 'companies' && (
                <div className="pl-6">
                  <Select
                    value={selectedCompanies.join(',')}
                    onValueChange={(value) => setSelectedCompanies(value ? value.split(',') : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione empresas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Template (opcional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={selectedTemplate === template.id ? "bg-brand hover:bg-brand/90" : ""}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input
                  placeholder="Assunto da mensagem..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>
            </div>

            {/* Schedule Option */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Agendar envio</p>
                  <p className="text-sm text-muted-foreground">Envie em uma data e hora específica</p>
                </div>
              </div>
              <Checkbox
                checked={isScheduled}
                onCheckedChange={(checked) => setIsScheduled(!!checked)}
              />
            </div>

            {isScheduled && (
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            )}

            {/* Send Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Badge variant="outline" className="bg-muted">
                <Users className="h-3 w-3 mr-1" />
                {getRecipientCount()} destinatário(s)
              </Badge>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                {isSending ? (
                  <>
                    <div className="mr-2 animate-spin">
                      <Send className="h-4 w-4" />
                    </div>
                    Enviando...
                  </>
                ) : isScheduled ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Agora
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
