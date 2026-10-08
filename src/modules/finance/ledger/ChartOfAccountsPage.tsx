'use client';

import { useState, useMemo, useEffect, useRef, memo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCanEdit } from "@/hooks/useCanEdit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderTree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplyTemplateDialog } from "@/modules/iam/settings/components/ApplyTemplateDialog";
import { TEMPLATE_CATEGORY_COUNT } from "@/data/chartOfAccountsTemplate";

import {
  useChartAccountsQueries,
  emptyFormData,
  type ChartAccount,
  type AccountEntryType,
  type ChartAccountFormData,
} from "./";

const TYPE_LABELS: Record<AccountEntryType, string> = {
  receita: "Receita",
  despesa: "Despesa",
  custo: "Custo",
  ativo: "Ativo",
  passivo: "Passivo",
  patrimonio: "PL",
};

const TYPE_COLORS: Record<AccountEntryType, string> = {
  receita: "bg-success/10 text-success border-success/20",
  despesa: "bg-destructive/10 text-destructive border-destructive/20",
  custo: "bg-warning/10 text-warning border-warning/20",
  ativo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  passivo: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  patrimonio: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

interface TreeNode extends ChartAccount {
  children: TreeNode[];
  level: number;
}

function buildTree(accounts: ChartAccount[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  accounts.forEach((account) => {
    map.set(account.id, { ...account, children: [], level: 0 });
  });

  accounts.forEach((account) => {
    const node = map.get(account.id)!;
    if (account.parent_id && map.has(account.parent_id)) {
      const parent = map.get(account.parent_id)!;
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}

interface TreeItemProps {
  node: TreeNode;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (account: ChartAccount) => void;
  onDelete: (account: ChartAccount) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const TreeItem = memo(({
  node,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: TreeItemProps) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg group",
          !node.is_active && "opacity-50"
        )}
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            aria-label="Expandir/recolher conta"
            onClick={() => onToggle(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        <span className="font-mono text-sm text-muted-foreground min-w-[80px]">
          {node.code}
        </span>
        <span className="flex-1 font-medium">{node.name}</span>

        <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[node.type])}>
          {TYPE_LABELS[node.type]}
        </Badge>

        {(node.type === 'despesa' || node.type === 'custo') && (
          <Badge variant="secondary" className={cn(
            "text-xs ml-1",
            node.cost_type === 'fixed'
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
          )}>
            {node.cost_type === 'fixed' ? 'Fixo' : 'Variável'}
          </Badge>
        )}

        {node.dre_category && (
          <Badge variant="secondary" className="text-xs">
            {node.dre_category}
          </Badge>
        )}

        {canEdit && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar conta"
              onClick={() => onEdit(node)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {canDelete && node.children.length === 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Excluir conta"
                onClick={() => onDelete(node)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </>
      )}
    </>
  );
});
TreeItem.displayName = 'TreeItem';


export default function ChartOfAccounts() {
  const { currentCompany } = useCompany();
  const { hasRole } = useAuth();

  // Feature hook - all data fetching via React Query
  const {
    accounts,
    isLoading,
    saveMutation,
    deleteMutation,
    invalidate,
  } = useChartAccountsQueries(currentCompany?.id);

  // UI state
  const [showInactive, setShowInactive] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [filterType, setFilterType] = useState<AccountEntryType | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<ChartAccount | null>(null);
  const [formData, setFormData] = useState<ChartAccountFormData>(emptyFormData);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const canEdit = useCanEdit();
  const canDelete = hasRole("admin");

  // Expand only root-level nodes when accounts first load
  const hasExpandedOnce = useRef(false);
  useEffect(() => {
    if (accounts.length > 0 && !hasExpandedOnce.current) {
      hasExpandedOnce.current = true;
      setExpandedIds(new Set(accounts.filter((a) => !a.parent_id).map((a) => a.id)));
    }
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesStatus = showInactive || account.is_active !== false;
      const matchesType = filterType === "all" || account.type === filterType;
      return matchesStatus && matchesType;
    });
  }, [accounts, showInactive, filterType]);

  const tree = useMemo(() => buildTree(filteredAccounts), [filteredAccounts]);

  const parentOptions = useMemo(() => {
    return accounts.filter(
      (a) => a.is_active && (!editingAccount || a.id !== editingAccount.id)
    );
  }, [accounts, editingAccount]);

  function toggleExpand(id: string) {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  }

  function expandAll() {
    setExpandedIds(new Set(accounts.map((a) => a.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  function generateNextCode(parentId: string | null): string {
    const siblings = accounts.filter((a) => a.parent_id === parentId);
    if (siblings.length === 0) {
      if (!parentId) {
        return "1";
      }
      const parent = accounts.find((a) => a.id === parentId);
      return parent ? `${parent.code}.1` : "1";
    }

    const codes = siblings.map((s) => {
      const parts = s.code.split(".");
      return parseInt(parts[parts.length - 1], 10);
    });
    const maxCode = Math.max(...codes);

    if (!parentId) {
      return (maxCode + 1).toString();
    }
    const parent = accounts.find((a) => a.id === parentId);
    return parent ? `${parent.code}.${maxCode + 1}` : (maxCode + 1).toString();
  }

  function handleNewAccount() {
    setEditingAccount(null);
    const suggestedCode = generateNextCode(null);
    setFormData({ ...emptyFormData, code: suggestedCode });
    setIsDialogOpen(true);
  }

  function handleEditAccount(account: ChartAccount) {
    setEditingAccount(account);
    setFormData({
      parent_id: account.parent_id || "",
      code: account.code,
      name: account.name,
      type: account.type,
      cost_type: account.cost_type || "variable",
      nature: account.nature || "devedora",
      is_analytical: account.is_analytical ?? true,
      dre_category: account.dre_category || "",
      is_active: account.is_active,
    });
    setIsDialogOpen(true);
  }

  function handleDeleteClick(account: ChartAccount) {
    setDeletingAccount(account);
    setIsDeleteDialogOpen(true);
  }

  function handleParentChange(parentId: string) {
    const suggestedCode = generateNextCode(parentId || null);
    setFormData({ ...formData, parent_id: parentId, code: suggestedCode });
  }

  async function handleSave() {
    if (!currentCompany || !formData.code.trim() || !formData.name.trim()) return;

    saveMutation.mutate(
      { formData, editingId: editingAccount?.id },
      { onSuccess: () => setIsDialogOpen(false) }
    );
  }

  async function handleDelete() {
    if (!deletingAccount) return;

    deleteMutation.mutate(deletingAccount.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeletingAccount(null);
      },
    });
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Selecione uma empresa para gerenciar o plano de contas.
        </p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Plano de Contas"
            description="Estrutura de contas para classificação financeira"
            actions={
              canEdit ? (
                <Button onClick={handleNewAccount}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
              ) : undefined
            }
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as AccountEntryType | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="passivo">Passivo</SelectItem>
                  <SelectItem value="patrimonio">Patrimônio Líquido</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                  <SelectItem value="custo">Custos</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="text-sm">
                  Mostrar inativas
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir tudo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Recolher tudo
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center border rounded-lg bg-muted/20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FolderTree className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Seu plano de contas está vazio</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Comece com nossa estrutura padrão brasileira ou crie suas próprias categorias do zero.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => setShowTemplateDialog(true)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Usar Modelo Padrão ({TEMPLATE_CATEGORY_COUNT}+ categorias)
                </Button>
                {canEdit && (
                  <Button variant="outline" onClick={handleNewAccount} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Conta Manual
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {tree.map((node) => (
                <TreeItem
                  key={node.id}
                  node={node}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteClick}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "Editar Conta" : "Nova Conta"}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount
                    ? "Atualize as informações da conta"
                    : "Preencha os dados da nova conta do plano de contas"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_id">Conta Pai</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={handleParentChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma (conta raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (conta raiz)</SelectItem>
                      {parentOptions.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="1.1.01"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome da conta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: AccountEntryType) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="passivo">Passivo</SelectItem>
                        <SelectItem value="patrimonio">Patrimônio Líquido</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="custo">Custo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nature">Natureza</Label>
                    <Select
                      value={formData.nature}
                      onValueChange={(value) =>
                        setFormData({ ...formData, nature: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="devedora">Devedora</SelectItem>
                        <SelectItem value="credora">Credora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dre_category">Categoria DRE</Label>
                  <Input
                    id="dre_category"
                    value={formData.dre_category}
                    onChange={(e) =>
                      setFormData({ ...formData, dre_category: e.target.value })
                    }
                    placeholder="Ex: Receita Operacional, Custos Variáveis..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_analytical"
                      checked={formData.is_analytical}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_analytical: checked })
                      }
                    />
                    <Label htmlFor="is_analytical">Conta analítica</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Conta ativa</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir a conta "{deletingAccount?.code} -{" "}
                  {deletingAccount?.name}"? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Apply Template Dialog */}
          <ApplyTemplateDialog
            open={showTemplateDialog}
            onOpenChange={setShowTemplateDialog}
            companyId={currentCompany.id}
            hasExistingAccounts={accounts.length > 0}
            onSuccess={() => invalidate()}
          />

        </div>
      </div>
    </AppLayout>
  );
}
