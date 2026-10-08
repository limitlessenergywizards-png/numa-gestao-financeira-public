'use client';

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Minus, Maximize2, DollarSign, TrendingDown, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChat } from "../hooks/useAiChat";
import { ChatMessage } from "./ChatMessage";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MAIN_ROUTES } from "@/lib/routes";

const WIDGET_SUGGESTIONS = [
    { icon: DollarSign, text: "Qual meu risco de caixa?", color: "text-red-500" },
    { icon: TrendingDown, text: "Onde cortar gastos?", color: "text-orange-500" },
    { icon: PiggyBank, text: "Projeção do mês", color: "text-emerald-500" },
];

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const { messages, isLoading, sendMessage } = useAiChat();
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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

    const handleExpand = () => {
        setIsOpen(false);
        router.push(MAIN_ROUTES.AI_CHAT);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-2xl shadow-2xl transition-[transform,opacity,box-shadow] duration-300 z-50 flex items-center justify-center",
                    "bg-gradient-to-br from-brand via-brand/90 to-brand/70 hover:shadow-brand/40 hover:shadow-xl hover:scale-105 active:scale-95",
                    "border border-white/20",
                    isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
                )}
            >
                <Sparkles className="w-6 h-6 text-white" />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-2xl animate-ping bg-brand/30 pointer-events-none" style={{ animationDuration: '3s' }} />
            </button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-6 right-6 w-[400px] h-[580px] max-h-[85vh] max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-[transform,opacity] duration-300 origin-bottom-right z-50",
                    "bg-background/95 backdrop-blur-xl border border-border/50",
                    isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand via-brand/95 to-brand/85 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm leading-tight">Consultor NUMA</h3>
                            <p className="text-[10px] text-white/70 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                Online · Financeiro & Estratégico
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/15 rounded-lg"
                            onClick={handleExpand}
                            title="Abrir em tela cheia"
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/15 rounded-lg"
                            onClick={() => setIsOpen(false)}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-muted/5" viewportRef={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-5 text-center pt-12">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/15 to-brand/5 flex items-center justify-center border border-brand/10 shadow-md">
                                    <Sparkles className="w-8 h-8 text-brand" />
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">Olá! Como posso ajudar?</p>
                                <p className="text-xs text-muted-foreground px-4">
                                    Sou seu consultor com visão real do seu caixa.
                                </p>
                            </div>

                            {/* Quick Suggestions */}
                            <div className="space-y-1.5 w-full px-2">
                                {WIDGET_SUGGESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q.text)}
                                        className="flex items-center gap-2.5 w-full p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/20 hover:border-brand/20 text-left transition-colors text-xs text-muted-foreground hover:text-foreground group"
                                    >
                                        <q.icon className={cn("w-3.5 h-3.5 flex-shrink-0", q.color)} />
                                        {q.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1 pb-2">
                            {messages.map((m) => (
                                <ChatMessage key={m.id} message={m} />
                            ))}
                            {isLoading && (
                                <div className="flex justify-start py-3 gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5 text-brand animate-spin" />
                                    </div>
                                    <div className="bg-muted/40 border border-border/30 rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.15s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.3s]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border/30 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleSend} className="relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte algo..."
                            className="pr-10 rounded-xl bg-muted/30 border-transparent focus-visible:ring-brand shadow-sm text-sm h-10"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-brand hover:bg-brand/90 transition-colors shadow-sm disabled:opacity-30"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
