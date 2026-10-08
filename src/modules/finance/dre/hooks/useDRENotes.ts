'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DRENote {
  id: string;
  company_id: string;
  chart_account_id: string | null;
  dre_line_id: string;
  period_year: number;
  period_month: number;
  note: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UseDRENotesReturn {
  notes: DRENote[];
  isLoading: boolean;
  getNoteForLine: (lineId: string) => DRENote | undefined;
  saveNote: (data: SaveNoteData) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
}

interface SaveNoteData {
  dre_line_id: string;
  chart_account_id?: string | null;
  note: string;
  is_important?: boolean;
}

export function useDRENotes(
  companyId: string | undefined,
  year: number,
  month: number
): UseDRENotesReturn {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DRENote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("dre_notes")
        .select("id, company_id, chart_account_id, dre_line_id, period_year, period_month, note, is_important, created_by, created_at, updated_at")
        .eq("company_id", companyId)
        .eq("period_year", year)
        .eq("period_month", month);

      if (error) throw error;
      setNotes((data as DRENote[]) || []);
    } catch (error) {
      console.error("Error fetching DRE notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, year, month]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const getNoteForLine = useCallback(
    (lineId: string): DRENote | undefined => {
      return notes.find((note) => note.dre_line_id === lineId);
    },
    [notes]
  );

  const saveNote = async (data: SaveNoteData) => {
    if (!companyId || !user) {
      toast.error("Erro ao salvar nota");
      return;
    }

    try {
      const existingNote = getNoteForLine(data.dre_line_id);

      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from("dre_notes")
          .update({
            note: data.note,
            is_important: data.is_important ?? false,
            chart_account_id: data.chart_account_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingNote.id)
          .eq("company_id", companyId);

        if (error) throw error;
        toast.success("Nota atualizada com sucesso");
      } else {
        // Create new note
        const { error } = await supabase.from("dre_notes").insert({
          company_id: companyId,
          dre_line_id: data.dre_line_id,
          chart_account_id: data.chart_account_id,
          period_year: year,
          period_month: month,
          note: data.note,
          is_important: data.is_important ?? false,
          created_by: user.id,
        });

        if (error) throw error;
        toast.success("Nota adicionada com sucesso");
      }

      await fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Erro ao salvar nota");
    }
  };

  const deleteNote = async (id: string) => {
    if (!companyId) return;
    try {
      const { error } = await supabase.from("dre_notes").update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deletion_reason: 'Excluído pelo usuário',
      }).eq("id", id).eq("company_id", companyId);

      if (error) throw error;
      toast.success("Nota removida");
      await fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Erro ao remover nota");
    }
  };

  return {
    notes,
    isLoading,
    getNoteForLine,
    saveNote,
    deleteNote,
    refreshNotes: fetchNotes,
  };
}
