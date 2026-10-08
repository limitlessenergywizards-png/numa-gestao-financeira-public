import { ArrowRight, Plus, Minus, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LogsDiffViewerProps {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  action: string;
}

interface DiffEntry {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "modified" | "unchanged";
}

export function LogsDiffViewer({ oldData, newData, action }: LogsDiffViewerProps) {
  // Detect new diff format: old_data = {"field": {"old": X, "new": Y}}, new_data = NULL
  const isDiffFormat = (): boolean => {
    if (newData !== null || !oldData) return false;
    const entries = Object.values(oldData);
    if (entries.length === 0) return false;
    const first = entries[0];
    return first !== null && typeof first === 'object' && 'old' in (first as Record<string, unknown>) && 'new' in (first as Record<string, unknown>);
  };

  const getDiff = (): DiffEntry[] => {
    // New diff format: old_data contains per-field {old, new} pairs
    if (action === 'UPDATE' && isDiffFormat()) {
      return Object.entries(oldData!).map(([key, change]) => {
        const c = change as Record<string, unknown>;
        return { key, oldValue: c.old, newValue: c.new, type: "modified" as const };
      });
    }

    // Legacy full-row format
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    const entries: DiffEntry[] = [];

    allKeys.forEach((key) => {
      // Skip internal/system fields
      if (key.startsWith("_") || key === "id" || key === "created_at" || key === "updated_at") {
        return;
      }

      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        entries.push({ key, oldValue, newValue, type: "added" });
      } else if (oldValue !== undefined && newValue === undefined) {
        entries.push({ key, oldValue, newValue, type: "removed" });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        entries.push({ key, oldValue, newValue, type: "modified" });
      } else {
        entries.push({ key, oldValue, newValue, type: "unchanged" });
      }
    });

    // Sort: modified first, then added, then removed, then unchanged
    const order = { modified: 0, added: 1, removed: 2, unchanged: 3 };
    return entries.sort((a, b) => order[a.type] - order[b.type]);
  };

  const diff = getDiff();
  const changedEntries = diff.filter((e) => e.type !== "unchanged");

  const formatValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      name: "Nome",
      trading_name: "Nome Fantasia",
      document: "Documento",
      email: "Email",
      phone: "Telefone",
      address: "Endereço",
      city: "Cidade",
      state: "Estado",
      zip_code: "CEP",
      is_headquarters: "É Matriz",
      full_name: "Nome Completo",
      job_title: "Cargo",
      role: "Perfil",
      status: "Status",
      amount: "Valor",
      description: "Descrição",
      due_date: "Vencimento",
      total_amount: "Valor Total",
      paid_amount: "Valor Pago",
    };
    return labels[key] || key;
  };

  const TypeIcon = {
    added: Plus,
    removed: Minus,
    modified: Edit,
    unchanged: ArrowRight,
  };

  const typeColors = {
    added: "text-emerald-500 bg-emerald-500/10",
    removed: "text-destructive bg-destructive/10",
    modified: "text-amber-500 bg-amber-500/10",
    unchanged: "text-muted-foreground bg-muted",
  };

  if (!oldData && !newData) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Sem dados para comparar
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="flex items-center gap-2 flex-wrap">
        {action === "INSERT" && (
          <Badge variant="default" className="gap-1">
            <Plus className="h-3 w-3" />
            Novo registro
          </Badge>
        )}
        {action === "DELETE" && (
          <Badge variant="destructive" className="gap-1">
            <Minus className="h-3 w-3" />
            Registro removido
          </Badge>
        )}
        {action === "UPDATE" && changedEntries.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Edit className="h-3 w-3" />
            {changedEntries.length} campo{changedEntries.length > 1 ? "s" : ""} alterado{changedEntries.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Diff Entries */}
      <div className="space-y-2">
        {changedEntries.map((entry) => {
          const Icon = TypeIcon[entry.type];
          return (
            <div
              key={entry.key}
              className={cn(
                "rounded-lg border p-3",
                entry.type === "added" && "border-emerald-500/30 bg-emerald-500/5",
                entry.type === "removed" && "border-destructive/30 bg-destructive/5",
                entry.type === "modified" && "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-1.5 rounded-md shrink-0", typeColors[entry.type])}>
                  <Icon className="h-3 w-3" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-medium">{getFieldLabel(entry.key)}</p>
                  
                  {entry.type === "modified" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Antes</p>
                        <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-auto max-h-20">
                          {formatValue(entry.oldValue)}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Depois</p>
                        <pre className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded overflow-auto max-h-20">
                          {formatValue(entry.newValue)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {entry.type === "added" && (
                    <pre className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded overflow-auto max-h-20">
                      {formatValue(entry.newValue)}
                    </pre>
                  )}
                  
                  {entry.type === "removed" && (
                    <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-auto max-h-20">
                      {formatValue(entry.oldValue)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {changedEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma alteração detectada
          </p>
        )}
      </div>
    </div>
  );
}
