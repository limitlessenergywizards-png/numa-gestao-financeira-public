'use client';

import { useState, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DateEditFieldProps {
  label: string;
  value: Date | string | undefined;
  originalValue?: Date | string | null;
  onChange: (date: Date | undefined) => void;
  recordId?: string;
  fieldName?: string;
  showOriginal?: boolean;
  warningText?: string;
  className?: string;
}

interface ChangeInfo {
  changedAt: string;
  changedBy: string | null;
}

export function DateEditField({
  label,
  value,
  originalValue,
  onChange,
  recordId,
  fieldName = "transaction_date",
  showOriginal = true,
  warningText,
  className,
}: DateEditFieldProps) {
  const [changeInfo, setChangeInfo] = useState<ChangeInfo | null>(null);
  const [open, setOpen] = useState(false);

  // Parse dates safely
  const parseDate = (d: Date | string | undefined | null): Date | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) return isValid(d) ? d : undefined;
    const parsed = parseISO(d);
    return isValid(parsed) ? parsed : undefined;
  };

  const currentDate = parseDate(value);
  const originalDate = parseDate(originalValue);
  const hasChanged = originalDate && currentDate && 
    format(originalDate, 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd');

  // Fetch change info from audit logs
  useEffect(() => {
    if (recordId && hasChanged) {
      fetchChangeInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, hasChanged]);

  const fetchChangeInfo = async () => {
    if (!recordId) return;
    
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('created_at, user_id')
        .eq('table_name', 'transactions')
        .eq('record_id', recordId)
        .eq('action', 'UPDATE')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data?.[0]) {
        setChangeInfo({
          changedAt: data[0].created_at,
          changedBy: data[0].user_id,
        });
      }
    } catch (error) {
      console.error('Error fetching change info:', error);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !currentDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDate ? (
              format(currentDate, "dd/MM/yyyy", { locale: ptBR })
            ) : (
              <span>Selecione uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2030}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Show original date info when changed */}
      {showOriginal && hasChanged && originalDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pencil className="h-3 w-3" />
          <span>
            Data original: {format(originalDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
          {changeInfo && (
            <span className="text-muted-foreground/70">
              • Alterada em {format(parseISO(changeInfo.changedAt), "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>
      )}

      {/* Warning text */}
      {warningText && (
        <p className="text-xs text-amber-500 flex items-center gap-1">
          <span>⚠️</span> {warningText}
        </p>
      )}
    </div>
  );
}
