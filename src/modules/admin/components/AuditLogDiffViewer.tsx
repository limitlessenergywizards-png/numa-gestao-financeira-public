'use client';

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface AuditLogDiffViewerProps {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}

interface DiffItem {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  status: "added" | "removed" | "changed" | "unchanged";
}

export function AuditLogDiffViewer({ oldData, newData }: AuditLogDiffViewerProps) {
  const diffItems = useMemo((): DiffItem[] => {
    const allKeys = new Set<string>();
    if (oldData) Object.keys(oldData).forEach((k) => allKeys.add(k));
    if (newData) Object.keys(newData).forEach((k) => allKeys.add(k));

    const items: DiffItem[] = [];

    allKeys.forEach((key) => {
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      let status: DiffItem["status"];
      if (oldValue === undefined && newValue !== undefined) {
        status = "added";
      } else if (oldValue !== undefined && newValue === undefined) {
        status = "removed";
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        status = "changed";
      } else {
        status = "unchanged";
      }

      items.push({ key, oldValue, newValue, status });
    });

    // Sort: changed first, then added, then removed, then unchanged
    const order = { changed: 0, added: 1, removed: 2, unchanged: 3 };
    return items.sort((a, b) => order[a.status] - order[b.status]);
  }, [oldData, newData]);

  const formatValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getStatusStyles = (status: DiffItem["status"]) => {
    switch (status) {
      case "added":
        return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
      case "removed":
        return "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400";
      case "changed":
        return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

  const getStatusLabel = (status: DiffItem["status"]) => {
    switch (status) {
      case "added":
        return "Novo";
      case "removed":
        return "Removido";
      case "changed":
        return "Alterado";
      default:
        return "";
    }
  };

  if (!oldData && !newData) {
    return <p className="text-sm text-muted-foreground">Sem detalhes disponíveis</p>;
  }

  return (
    <div className="space-y-2">
      {diffItems.map((item) => (
        <div
          key={item.key}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            getStatusStyles(item.status)
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{item.key}</span>
            {item.status !== "unchanged" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
                {getStatusLabel(item.status)}
              </span>
            )}
          </div>

          {item.status === "changed" && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Anterior:</span>
                <div className="bg-red-500/10 rounded px-2 py-1 line-through">
                  {formatValue(item.oldValue)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Novo:</span>
                <div className="bg-green-500/10 rounded px-2 py-1">
                  {formatValue(item.newValue)}
                </div>
              </div>
            </div>
          )}

          {item.status === "added" && (
            <div className="text-xs">
              <span className="bg-green-500/10 rounded px-2 py-1 inline-block">
                {formatValue(item.newValue)}
              </span>
            </div>
          )}

          {item.status === "removed" && (
            <div className="text-xs">
              <span className="bg-red-500/10 rounded px-2 py-1 inline-block line-through">
                {formatValue(item.oldValue)}
              </span>
            </div>
          )}

          {item.status === "unchanged" && (
            <div className="text-xs opacity-60">
              {formatValue(item.newValue || item.oldValue)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
