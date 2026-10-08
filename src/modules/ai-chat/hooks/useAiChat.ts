'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/lib/supabase/edge-functions';
import { EDGE_FUNCTIONS } from '@/lib/api-endpoints';
import { useAiChatContext } from './useAiChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

export interface Conversation {
    id: string;
    title: string;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function useAiChat() {
    const contextData = useAiChatContext();
    const { user } = useAuth();
    const { currentCompany } = useCompany();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);

    // Load conversation list
    const loadConversations = useCallback(async () => {
        if (!user || !currentCompany) return;
        setIsLoadingConversations(true);
        try {
            const { data, error } = await supabase
                .from('ai_conversations')
                .select('id, title, archived, created_at, updated_at')
                .eq('company_id', currentCompany.id)
                .eq('archived', false)
                .order('updated_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setConversations(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (data || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    archived: c.archived ?? false,
                    createdAt: new Date(c.created_at),
                    updatedAt: new Date(c.updated_at),
                }))
            );
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [user, currentCompany]);

    // Load messages for a conversation
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('ai_messages')
                .select('id, role, content, created_at')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (data || []).map((m: any) => ({
                    id: m.id,
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                    createdAt: new Date(m.created_at),
                }))
            );
            setActiveConversationId(conversationId);
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    }, []);

    // Select a conversation
    const selectConversation = useCallback(async (conversationId: string) => {
        setActiveConversationId(conversationId);
        await loadMessages(conversationId);
    }, [loadMessages]);

    // Create new conversation
    const createConversation = useCallback(async (firstMessageContent?: string): Promise<string | null> => {
        if (!user || !currentCompany) return null;
        try {
            const title = firstMessageContent
                ? firstMessageContent.slice(0, 60) + (firstMessageContent.length > 60 ? '...' : '')
                : 'Nova Conversa';

            const { data, error } = await supabase
                .from('ai_conversations')
                .insert({ company_id: currentCompany.id, user_id: user.id, title })
                .select('id')
                .single();

            if (error) throw error;
            const newId = data.id;
            setActiveConversationId(newId);
            setMessages([]);
            await loadConversations();
            return newId;
        } catch (err) {
            console.error('Error creating conversation:', err);
            return null;
        }
    }, [user, currentCompany, loadConversations]);

    // Start a new blank chat
    const newChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
    }, []);

    // Delete a conversation
    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            const { error } = await supabase
                .from('ai_conversations')
                .delete()
                .eq('id', conversationId)
                .eq('company_id', currentCompany!.id);
            if (error) throw error;

            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
                setMessages([]);
            }
            await loadConversations();
            toast.success('Conversa excluída.');
        } catch (err) {
            console.error('Error deleting conversation:', err);
            toast.error('Erro ao excluir conversa.');
        }
    }, [activeConversationId, loadConversations, currentCompany]);

    // Rename a conversation
    const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
        if (!newTitle.trim()) return;
        try {
            const { error } = await supabase
                .from('ai_conversations')
                .update({ title: newTitle.trim() })
                .eq('id', conversationId)
                .eq('company_id', currentCompany!.id);
            if (error) throw error;
            await loadConversations();
            toast.success('Conversa renomeada.');
        } catch (err) {
            console.error('Error renaming conversation:', err);
            toast.error('Erro ao renomear conversa.');
        }
    }, [loadConversations, currentCompany]);

    // Archive a conversation
    const archiveConversation = useCallback(async (conversationId: string) => {
        try {
            const { error } = await supabase
                .from('ai_conversations')
                .update({ archived: true })
                .eq('id', conversationId)
                .eq('company_id', currentCompany!.id);
            if (error) throw error;

            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
                setMessages([]);
            }
            await loadConversations();
            toast.success('Conversa arquivada.');
        } catch (err) {
            console.error('Error archiving conversation:', err);
            toast.error('Erro ao arquivar conversa.');
        }
    }, [activeConversationId, loadConversations, currentCompany]);

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !user || !currentCompany) return;

        // Create conversation if none active
        let convId = activeConversationId;
        if (!convId) {
            convId = await createConversation(content);
            if (!convId) {
                toast.error('Erro ao criar conversa.');
                return;
            }
        }

        // Optimistic user message
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            createdAt: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Persist user message
            await supabase.from('ai_messages').insert({
                conversation_id: convId,
                role: 'user',
                content,
            });

            // Build history for the AI
            const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
            historyPayload.push({ role: 'user', content });

            const data = await callEdgeFunction<{ response: string }>(EDGE_FUNCTIONS.AI_CHAT, {
                body: { messages: historyPayload, context: contextData },
                fallbackMessage: 'Erro ao se comunicar com o consultor',
            });

            const aiContent = data.response;

            // Persist assistant message
            const { data: savedMsg } = await supabase.from('ai_messages').insert({
                conversation_id: convId,
                role: 'assistant',
                content: aiContent,
            }).select('id').single();

            const assistantMessage: ChatMessage = {
                id: savedMsg?.id || crypto.randomUUID(),
                role: 'assistant',
                content: aiContent,
                createdAt: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Update conversation title & timestamp
            await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId).eq('company_id', currentCompany!.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('AI Chat Error:', err);
            toast.error('Não foi possível se comunicar com o consultor.', {
                description: err.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [messages, contextData, activeConversationId, createConversation, user, currentCompany]);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    return {
        messages,
        isLoading,
        sendMessage,
        conversations,
        isLoadingConversations,
        activeConversationId,
        selectConversation,
        newChat,
        deleteConversation,
        renameConversation,
        archiveConversation,
        loadConversations,
    };
}
