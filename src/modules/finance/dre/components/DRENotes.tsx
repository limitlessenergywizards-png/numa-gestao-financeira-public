'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare, MessageSquarePlus, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { DRENote } from "../hooks/useDRENotes";

interface DRENoteButtonProps {
  lineId: string;
  lineName: string;
  note?: DRENote;
  onClick: () => void;
}

export function DRENoteButton({ lineId, lineName, note, onClick }: DRENoteButtonProps) {
  const hasNote = !!note;
  const isImportant = note?.is_important;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
              p-1.5 rounded-md transition-colors duration-200
              ${hasNote 
                ? isImportant 
                  ? "bg-warning/20 text-warning hover:bg-warning/30" 
                  : "bg-primary/20 text-primary hover:bg-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            `}
          >
            {hasNote ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <MessageSquarePlus className="h-4 w-4" />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className={`max-w-[300px] ${hasNote ? "" : "py-1"}`}
        >
          {hasNote ? (
            <div className="space-y-1">
              {isImportant && (
                <Badge variant="outline" className="text-warning border-warning mb-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Importante
                </Badge>
              )}
              <p className="text-sm">{note.note}</p>
            </div>
          ) : (
            <p className="text-xs">Adicionar nota</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface DRENoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineId: string;
  lineName: string;
  periodLabel: string;
  note?: DRENote;
  onSave: (data: { note: string; is_important: boolean }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function DRENoteDialog({
  open,
  onOpenChange,
  lineId,
  lineName,
  periodLabel,
  note,
  onSave,
  onDelete,
}: DRENoteDialogProps) {
  const [noteText, setNoteText] = useState(note?.note || "");
  const [isImportant, setIsImportant] = useState(note?.is_important || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ note: noteText.trim(), is_important: isImportant });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setNoteText(note?.note || "");
      setIsImportant(note?.is_important || false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Nota Explicativa
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{lineName}</span>
            <span>{periodLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Digite sua nota explicativa aqui...

Exemplo: O aumento nesta linha deve-se ao lançamento de nova linha de produtos em dezembro."
            className="min-h-[150px] resize-none"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="important"
                checked={isImportant}
                onCheckedChange={setIsImportant}
              />
              <Label 
                htmlFor="important" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className={`h-4 w-4 ${isImportant ? "text-warning" : "text-muted-foreground"}`} />
                Marcar como importante
              </Label>
            </div>

            {note && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!noteText.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              note ? "Atualizar Nota" : "Salvar Nota"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DRENotesListProps {
  notes: DRENote[];
  onEditNote: (note: DRENote) => void;
}

export function DRENotesList({ notes, onEditNote }: DRENotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma nota explicativa adicionada</p>
        <p className="text-sm">Clique no ícone ao lado de uma linha do DRE para adicionar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className={`
              p-4 rounded-lg border cursor-pointer transition-[transform,box-shadow]
              hover:shadow-md hover:border-primary/50
              ${note.is_important ? "border-warning/50 bg-warning/5" : "bg-card"}
            `}
            onClick={() => onEditNote(note)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    [{note.dre_line_id}]
                  </span>
                  {note.is_important && (
                    <Badge variant="outline" className="text-warning border-warning text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Importante
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.note}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
