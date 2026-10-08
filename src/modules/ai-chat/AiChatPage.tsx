'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import {
    Send, Sparkles, Plus, Trash2, MessageSquare,
    TrendingDown, AlertTriangle, DollarSign, PiggyBank, BarChart3,
    PanelLeftClose, PanelLeft, Bot, Zap, Shield, ArrowRight,
    MoreHorizontal, Pencil, Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAiChat } from "./hooks/useAiChat";
import { useAiChatContext } from "./hooks/useAiChatContext";
import { ChatMessage } from "./components/ChatMessage";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SUGGESTED_QUESTIONS = [
    { icon: DollarSign, label: "Risco de Caixa", text: "Qual o risco de eu ficar sem saldo esta semana?", gradient: "from-red-500/20 to-red-500/5", border: "border-red-500/20", iconColor: "text-red-500" },
    { icon: TrendingDown, label: "Cortar Gastos", text: "Como posso reduzir minhas despesas operacionais?", gradient: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/20", iconColor: "text-orange-500" },
    { icon: PiggyBank, label: "Plano 30 Dias", text: "Monte um plano de corte de gastos para os próximos 30 dias", gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", iconColor: "text-emerald-500" },
    { icon: BarChart3, label: "Projeção", text: "Faça uma projeção de fluxo de caixa para o próximo mês", gradient: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", iconColor: "text-blue-500" },
    { icon: AlertTriangle, label: "Inadimplência", text: "Quais contas a pagar estão atrasadas e qual o impacto?", gradient: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", iconColor: "text-amber-500" },
    { icon: Sparkles, label: "Saúde Geral", text: "Me dê uma análise geral da saúde financeira da empresa", gradient: "from-brand/20 to-brand/5", border: "border-brand/20", iconColor: "text-brand" },
];

export default function AiChatPage() {
    const [input, setInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const {
        messages, isLoading, sendMessage,
        conversations, activeConversationId, selectConversation,
        newChat, deleteConversation, renameConversation, archiveConversation
    } = useAiChat();
    const contextData = useAiChatContext();
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { currentCompany } = useCompany();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestion = (text: string) => {
        sendMessage(text);
    };

    // Proactive alerts
    const proactiveAlerts = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alerts: { icon: any; text: string; severity: 'danger' | 'warning'; action: string }[] = [];
        if (!contextData) return alerts;
        const { currentBalance, overduePayables, overdueReceivables, monthlyPayables } = contextData;

        if (currentBalance !== undefined && monthlyPayables !== undefined && currentBalance < monthlyPayables * 0.3) {
            alerts.push({
                icon: AlertTriangle,
                text: `Seu saldo atual cobre menos de 30% das contas a pagar do mês`,
                severity: 'danger',
                action: 'Analisar risco de caixa',
            });
        }
        if (overduePayables && overduePayables > 0) {
            alerts.push({
                icon: TrendingDown,
                text: `R$ ${overduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em contas a pagar atrasadas`,
                severity: 'warning',
                action: 'Ver detalhes',
            });
        }
        if (overdueReceivables && overdueReceivables > 0) {
            alerts.push({
                icon: DollarSign,
                text: `R$ ${overdueReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em inadimplência`,
                severity: 'warning',
                action: 'Planejar cobrança',
            });
        }
        return alerts;
    }, [contextData]);

    return (
        <AppLayout title="Consultor IA" description="Inteligência artificial baseada nos seus dados reais.">
            <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-2xl border border-border/30">

                {/* ═══ SIDEBAR ═══ */}
                <div className={cn(
                    "flex flex-col bg-muted/40 backdrop-blur-md transition-[width] duration-300 ease-in-out flex-shrink-0 border-r border-border/40 overflow-hidden",
                    sidebarOpen ? "w-[300px]" : "w-0 border-r-0"
                )}>
                    <div className={cn("flex flex-col h-full w-[300px] overflow-hidden transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
                        {/* Sidebar Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <MessageSquare className="w-3.5 h-3.5 text-brand" />
                                </div>
                                <span className="text-sm font-semibold text-foreground">Conversas</span>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg hover:bg-brand/10 text-muted-foreground hover:text-brand transition-colors"
                                        onClick={newChat}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Nova conversa</TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Conversations List */}
                        <ScrollArea className="flex-1 px-2 overflow-y-auto">
                            <div className="space-y-1 pb-4">
                                {conversations.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                                            <MessageSquare className="w-5 h-5 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                            Nenhuma conversa salva.<br />Inicie uma nova!
                                        </p>
                                    </div>
                                ) : (
                                    conversations.map(conv => (
                                        <div
                                            key={conv.id}
                                            className={cn(
                                                "group relative rounded-xl cursor-pointer transition-colors duration-200 border w-full max-w-[283px] overflow-hidden",
                                                conv.id === activeConversationId
                                                    ? "bg-brand/10 border-brand/20 shadow-sm shadow-brand/5"
                                                    : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/30"
                                            )}
                                            onClick={() => selectConversation(conv.id)}
                                        >
                                            {/* ⋯ Menu — absolute position, never in flex flow */}
                                            <div className="absolute top-2 right-2 z-10">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                "h-6 w-6 flex items-center justify-center rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm",
                                                                conv.id === activeConversationId
                                                                    ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" // Active: Green button
                                                                    : "bg-brand/20 text-brand hover:bg-brand/30" // Inactive: Gold button
                                                            )}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-40">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTitle(conv.title);
                                                            setEditingId(conv.id);
                                                        }}>
                                                            <Pencil className="mr-2 h-3.5 w-3.5" />
                                                            Renomear
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            archiveConversation(conv.id);
                                                        }}>
                                                            <Archive className="mr-2 h-3.5 w-3.5" />
                                                            Arquivar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteConversation(conv.id);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Content row: icon + title */}
                                            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1 pr-10">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                                                    conv.id === activeConversationId
                                                        ? "bg-brand/20" // Active: Gold icon bg
                                                        : "bg-muted/30" // Inactive: Neutral icon bg
                                                )}>
                                                    <MessageSquare className={cn(
                                                        "w-2.5 h-2.5",
                                                        conv.id === activeConversationId
                                                            ? "text-brand" // Active: Gold icon
                                                            : "text-muted-foreground" // Inactive: Neutral icon
                                                    )} />
                                                </div>
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    {editingId === conv.id ? (
                                                        <input
                                                            autoFocus
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    renameConversation(conv.id, editingTitle);
                                                                    setEditingId(null);
                                                                }
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                            onBlur={() => {
                                                                if (editingTitle.trim() && editingTitle !== conv.title) {
                                                                    renameConversation(conv.id, editingTitle);
                                                                }
                                                                setEditingId(null);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full text-[13px] bg-transparent border-b border-brand/40 outline-none text-foreground py-0.5 leading-tight"
                                                        />
                                                    ) : (
                                                        <p className={cn(
                                                            "conversation-title text-[13px] leading-tight",
                                                            conv.id === activeConversationId
                                                                ? "text-brand font-semibold" // Active: Gold text
                                                                : "text-foreground group-hover:text-foreground" // Inactive: Neutral text
                                                        )}>{conv.title}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date row */}
                                            <div className="px-3 pb-2.5 pl-10">
                                                <p className={cn(
                                                    "text-[10px]",
                                                    conv.id === activeConversationId ? "text-brand/60" : "text-muted-foreground/50"
                                                )}>
                                                    {format(conv.updatedAt, "dd MMM · HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* ═══ MAIN CHAT AREA ═══ */}
                <div className="flex-1 flex flex-col min-w-0 bg-background/50 h-full overflow-hidden">

                    {/* Header */}
                    <div className="px-5 py-3 border-b border-border/20 flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted/50 text-muted-foreground"
                            onClick={() => setSidebarOpen(prev => !prev)}
                        >
                            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                        </Button>

                        <div className="w-px h-6 bg-border/30" />

                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand/15 to-brand/5 flex items-center justify-center border border-brand/15">
                                <Sparkles className="w-4 h-4 text-brand" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-semibold text-foreground leading-tight">NUMA Consultor</h2>
                            <p className="text-[11px] text-muted-foreground/70 truncate">
                                {currentCompany?.name || "Carregando..."}
                                <span className="mx-1.5">·</span>
                                <span className="text-emerald-500">Online</span>
                            </p>
                        </div>
                    </div>

                    {/* ═══ MESSAGES AREA ═══ */}
                    <ScrollArea className="flex-1 min-h-0" viewportRef={scrollRef}>
                        <div className="px-5 py-4 max-w-3xl mx-auto w-full">
                            {messages.length === 0 ? (
                                /* ═══ EMPTY STATE (WELCOME) ═══ */
                                <div className="flex flex-col items-center pt-8 pb-4">
                                    {/* Avatar */}
                                    <div className="relative mb-6">
                                        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand/15 via-brand/10 to-transparent flex items-center justify-center border border-brand/10 shadow-xl shadow-brand/5">
                                            <Sparkles className="w-8 h-8 text-brand" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-background flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-foreground mb-1">Olá! Sou o NUMA</h2>
                                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">
                                        Seu consultor financeiro e estratégico com visão dos dados reais do seu negócio.
                                    </p>

                                    {/* Capability badges */}
                                    <div className="flex items-center gap-2 mb-8">
                                        {[
                                            { icon: Zap, label: "Tempo Real" },
                                            { icon: Shield, label: "Dados Seguros" },
                                            { icon: Bot, label: "IA Avançada" },
                                        ].map((badge, i) => (
                                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 border border-border/20 text-[10px] text-muted-foreground">
                                                <badge.icon className="w-3 h-3" />
                                                {badge.label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Proactive Alerts */}
                                    {proactiveAlerts.length > 0 && (
                                        <div className="w-full max-w-lg space-y-2 mb-6">
                                            <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider px-1 mb-2">
                                                ⚡ Alertas Detectados
                                            </p>
                                            {proactiveAlerts.map((alert, i) => (
                                                <button
                                                    key={i}
                                                    className={cn(
                                                        "flex items-center gap-3 w-full p-3 rounded-xl text-left transition-[transform,border-color] hover:scale-[1.01] active:scale-[0.99]",
                                                        alert.severity === 'danger'
                                                            ? "bg-red-500/8 border border-red-500/15 hover:border-red-500/30"
                                                            : "bg-amber-500/8 border border-amber-500/15 hover:border-amber-500/30"
                                                    )}
                                                    onClick={() => handleSuggestion(`Analise este alerta e me dê recomendações: ${alert.text}`)}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                        alert.severity === 'danger' ? "bg-red-500/15" : "bg-amber-500/15"
                                                    )}>
                                                        <alert.icon className={cn(
                                                            "w-4 h-4",
                                                            alert.severity === 'danger' ? "text-red-500" : "text-amber-500"
                                                        )} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-xs font-medium",
                                                            alert.severity === 'danger' ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                                                        )}>{alert.text}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 flex-shrink-0">
                                                        <span>{alert.action}</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Suggestion Cards */}
                                    <div className="w-full max-w-lg">
                                        <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider px-1 mb-3">
                                            Sugestões para começar
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSuggestion(q.text)}
                                                    className={cn(
                                                        "flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-[transform,box-shadow] duration-200 group",
                                                        "hover:scale-[1.02] active:scale-[0.98] hover:shadow-md",
                                                        `bg-gradient-to-br ${q.gradient} ${q.border} hover:border-opacity-50`
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <q.icon className={cn("w-4 h-4", q.iconColor)} />
                                                        <span className="text-xs font-semibold text-foreground/90">{q.label}</span>
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 group-hover:text-foreground/70 transition-colors">
                                                        {q.text}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ═══ MESSAGES LIST ═══ */
                                <div className="space-y-1 pb-4">
                                    {messages.map((m) => (
                                        <ChatMessage key={m.id} message={m} />
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-start gap-3 py-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand/15 to-brand/5 flex items-center justify-center border border-brand/15">
                                                <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                                            </div>
                                            <div className="bg-muted/20 border border-border/20 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand/80 animate-bounce" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand/80 animate-bounce [animation-delay:0.15s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand/80 animate-bounce [animation-delay:0.3s]" />
                                                <span className="text-[11px] text-muted-foreground/60 ml-2">Analisando dados...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* ═══ INPUT AREA ═══ */}
                    <div className="px-5 py-3 border-t border-border/20">
                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={handleSend} className="relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Pergunte algo ao seu consultor financeiro..."
                                    className={cn(
                                        "w-full min-h-[52px] max-h-[140px] resize-none rounded-2xl px-5 py-3.5 pr-14 text-[15px] leading-relaxed",
                                        "bg-card border border-border/40 shadow-sm placeholder:text-muted-foreground/50",
                                        "focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/30",
                                        "transition-[border-color,box-shadow] duration-300",
                                        isLoading && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={isLoading}
                                    rows={1}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isLoading}
                                    className={cn(
                                        "absolute right-2.5 bottom-2.5 h-9 w-9 rounded-xl transition-colors duration-300 shadow-sm",
                                        input.trim()
                                            ? "bg-brand hover:scale-105 hover:bg-brand/90 text-white shadow-brand/20"
                                            : "bg-muted/60 text-muted-foreground/40 cursor-not-allowed"
                                    )}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </form>
                            <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
                                Respostas geradas por IA · Verifique os valores nos relatórios
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
