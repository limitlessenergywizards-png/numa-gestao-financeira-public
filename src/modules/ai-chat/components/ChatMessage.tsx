'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { ChatMessage as IChatMessage } from '../hooks/useAiChat';

interface ChatMessageProps {
    message: IChatMessage;
}

// Simple markdown-like renderer
function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
        // Bold
        let processed: React.ReactNode = line;
        if (line.match(/\*\*(.*?)\*\*/g)) {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            processed = parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
            );
        }

        // Headers
        if (line.startsWith('### ')) {
            elements.push(<h4 key={i} className="font-bold text-sm mt-3 mb-1 text-foreground">{line.slice(4)}</h4>);
        } else if (line.startsWith('## ')) {
            elements.push(<h3 key={i} className="font-bold text-base mt-3 mb-1 text-foreground">{line.slice(3)}</h3>);
        } else if (line.startsWith('# ')) {
            elements.push(<h2 key={i} className="font-bold text-lg mt-3 mb-1 text-foreground">{line.slice(2)}</h2>);
        }
        // Bullet points
        else if (line.match(/^[-•*]\s/)) {
            elements.push(
                <div key={i} className="flex gap-2 pl-1 py-0.5">
                    <span className="text-brand mt-0.5">•</span>
                    <span>{processed}</span>
                </div>
            );
        }
        // Numbered items
        else if (line.match(/^\d+\.\s/)) {
            const num = line.match(/^(\d+)\.\s/)?.[1];
            const rest = line.replace(/^\d+\.\s/, '');
            elements.push(
                <div key={i} className="flex gap-2 pl-1 py-0.5">
                    <span className="text-brand font-medium min-w-[1.2rem]">{num}.</span>
                    <span>{typeof processed === 'string' ? rest : processed}</span>
                </div>
            );
        }
        // Empty line = spacing
        else if (line.trim() === '') {
            elements.push(<div key={i} className="h-2" />);
        }
        // Regular text
        else {
            elements.push(<p key={i} className="py-0.5">{processed}</p>);
        }
    });

    return elements;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [message.content]);

    const renderedContent = useMemo(() => {
        if (isUser) return message.content;
        return renderMarkdown(message.content);
    }, [message.content, isUser]);

    return (
        <div
            className={cn(
                "group flex w-full gap-3 py-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center border border-brand/20 shadow-sm">
                    <Bot className="w-4 h-4 text-brand" />
                </div>
            )}

            <div className="flex flex-col max-w-[85%] min-w-0">
                <div
                    className={cn(
                        "rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed relative overflow-x-auto",
                        isUser
                            ? "bg-brand text-white rounded-br-sm shadow-md shadow-brand/20"
                            : "bg-card border border-border/40 rounded-tl-sm text-foreground shadow-sm"
                    )}
                >
                    {isUser ? (
                        <span className="whitespace-pre-wrap">{renderedContent}</span>
                    ) : (
                        <div className="space-y-0">{renderedContent}</div>
                    )}
                </div>

                {/* Actions row */}
                <div className={cn(
                    "flex items-center gap-2 mt-1 px-1 transition-opacity duration-200",
                    isUser ? "justify-end" : "justify-start",
                    "opacity-0 group-hover:opacity-100"
                )}>
                    <span className="text-[10px] text-muted-foreground">
                        {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && (
                        <button
                            onClick={handleCopy}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                            title="Copiar resposta"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                    )}
                </div>
            </div >

            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center border border-border/50">
                    <User className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
        </div >
    );
});
