'use client';

import { useState, useMemo } from "react";
import { CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { AdminAuditLog } from "@/modules/admin/hooks/useAdminData";

export interface AuditLogFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  userId: string | undefined;
  entities: string[];
  actions: string[];
}

interface AuditLogFiltersProps {
  logs: AdminAuditLog[];
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
}

const ENTITY_LABELS: Record<string, string> = {
  companies: "Empresas",
  profiles: "Perfis",
  user_companies: "Acessos",
  user_invitations: "Convites",
  customers: "Clientes",
  suppliers: "Fornecedores",
  receivables: "Contas a Receber",
  payables: "Contas a Pagar",
  transactions: "Transações",
  bank_accounts: "Contas Bancárias",
  chart_of_accounts: "Plano de Contas",
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Atualização",
  DELETE: "Remoção",
};

export function AuditLogFiltersComponent({ logs, filters, onFiltersChange }: AuditLogFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract unique users and entities from logs
  const { uniqueUsers, uniqueEntities, uniqueActions } = useMemo(() => {
    const users = new Map<string, string>();
    const entities = new Set<string>();
    const actions = new Set<string>();

    logs.forEach((log) => {
      if (log.user_id && log.user_name) {
        users.set(log.user_id, log.user_name);
      }
      entities.add(log.table_name);
      actions.add(log.action);
    });

    return {
      uniqueUsers: Array.from(users.entries()).map(([id, name]) => ({ id, name })),
      uniqueEntities: Array.from(entities),
      uniqueActions: Array.from(actions),
    };
  }, [logs]);

  const activeFiltersCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.userId,
    filters.entities.length > 0,
    filters.actions.length > 0,
  ].filter(Boolean).length;

  const handleEntityToggle = (entity: string) => {
    const newEntities = filters.entities.includes(entity)
      ? filters.entities.filter((e) => e !== entity)
      : [...filters.entities, entity];
    onFiltersChange({ ...filters, entities: newEntities });
  };

  const handleActionToggle = (action: string) => {
    const newActions = filters.actions.includes(action)
      ? filters.actions.filter((a) => a !== action)
      : [...filters.actions, action];
    onFiltersChange({ ...filters, actions: newActions });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateFrom: undefined,
      dateTo: undefined,
      userId: undefined,
      entities: [],
      actions: [],
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros Avançados</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Período</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yy") : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                    locale={ptBR}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={2030}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "dd/MM/yy") : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                    locale={ptBR}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={2030}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Usuário</Label>
            <Select
              value={filters.userId || "all"}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, userId: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Entidades</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {uniqueEntities.map((entity) => (
                <div key={entity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`entity-${entity}`}
                    checked={filters.entities.includes(entity)}
                    onCheckedChange={() => handleEntityToggle(entity)}
                  />
                  <label htmlFor={`entity-${entity}`} className="text-sm cursor-pointer">
                    {ENTITY_LABELS[entity] || entity}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ações</Label>
            <div className="flex gap-2">
              {uniqueActions.map((action) => (
                <Button
                  key={action}
                  variant={filters.actions.includes(action) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleActionToggle(action)}
                >
                  {ACTION_LABELS[action] || action}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
