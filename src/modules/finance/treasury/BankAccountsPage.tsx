'use client';

import { useState, useMemo } from "react";
import { useFormatters } from "@/hooks/useFormatters";


import { AppLayout } from "@/components/layout/AppLayout";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid, StatItem } from "@/components/ui/stats-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { BankLogo } from "@/components/ui/bank-logo";
import { cn } from "@/lib/utils";
import { bankAccountSchema, validateWithToast } from "@/lib/validations/financial-schemas";

import {
  useBankAccountsQueries,
  emptyFormData,
  type BankAccount,
  type BankAccountType,
  type BankAccountFormData,
} from "./";

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  corrente: "Conta Corrente",
  poupanca: "Poupança",
  investimento: "Investimento",
  caixa: "Caixa",
};

export default function BankAccounts() {
  const { currentCompany } = useCompany();
  const { hasRole } = useAuth();
  const { formatCurrency } = useFormatters();

  // Feature hook - all data fetching via React Query
  const {
    accounts,
    transactions,
    isLoading,
    saveMutation,
    deleteMutation,
  } = useBankAccountsQueries(currentCompany?.id);

  // UI state
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<BankAccountFormData>(emptyFormData);

  const canEdit = useCanEdit();
  const canDelete = hasRole("admin");

  function handleNewAccount() {
    setEditingAccount(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  }

  function handleEditAccount(account: BankAccount) {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      bank_name: account.bank_name || "",
      agency: account.agency || "",
      account_number: account.account_number || "",
      account_type: account.account_type,
      initial_balance: account.initial_balance.toString(),
      is_active: account.is_active,
    });
    setIsDialogOpen(true);
  }

  function handleDeleteClick(account: BankAccount) {
    setDeletingAccount(account);
    setIsDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!validateWithToast(bankAccountSchema, formData)) return;
    if (!currentCompany) return;

    saveMutation.mutate(
      { formData, editingAccount },
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

  const filteredAccounts = accounts.filter((account) => {
    return showInactive || account.is_active;
  });

  const totalBalance = filteredAccounts.reduce(
    (sum, account) => sum + account.current_balance,
    0
  );

  const positiveBalance = filteredAccounts
    .filter((a) => a.current_balance >= 0)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const negativeBalance = filteredAccounts
    .filter((a) => a.current_balance < 0)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const stats: StatItem[] = useMemo(() => [
    {
      title: "Saldo Total",
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: "teal",
    },
    {
      title: "Contas Ativas",
      value: filteredAccounts.filter((a) => a.is_active).length,
      icon: TrendingUp,
      color: "info",
    },
    {
      title: "Saldo Positivo",
      value: formatCurrency(positiveBalance),
      icon: TrendingUp,
      color: "success",
    },
    {
      title: "Saldo Negativo",
      value: formatCurrency(Math.abs(negativeBalance)),
      icon: TrendingDown,
      color: "destructive",
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [filteredAccounts, totalBalance, positiveBalance, negativeBalance]);

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Selecione uma empresa para gerenciar contas bancárias.
        </p>
      </div>
    );
  }

  return (
    <AppLayout title="Contas Bancárias" description="Gerencie suas contas bancárias">
      <div className="space-y-6 animate-fade-in">
        <div>
          <PageHeader
            title="Contas Bancárias"
            description="Gerencie as contas bancárias da sua empresa"
            actions={
              canEdit && (
                <Button onClick={handleNewAccount}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
              )
            }
          />
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <StatsGrid stats={stats} columns={4} variant="vibrant" />
        </div>

        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm">
            Mostrar inativas
          </Label>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhuma conta bancária encontrada"
            description="Comece adicionando sua primeira conta"
            action={
              canEdit
                ? { label: "Nova Conta", onClick: handleNewAccount }
                : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => {
              const accountTransactions = transactions[account.id] || [];
              const isNegative = account.current_balance < 0;

              return (
                <div key={account.id} className="animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
                  <Card
                    className={cn(
                      "overflow-hidden transition-[transform,box-shadow] hover:shadow-lg h-full",
                      !account.is_active && "opacity-60"
                    )}
                  >
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-3">
                        <BankLogo bankName={account.bank_name} size="md" />
                        <div>
                          <CardTitle className="text-base font-medium">
                            {account.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {account.bank_name || "Sem banco"}
                            {account.agency && ` | Ag: ${account.agency}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!account.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inativa
                          </Badge>
                        )}
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Editar conta bancária"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                aria-label="Excluir conta bancária"
                                onClick={() => handleDeleteClick(account)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Balance */}
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo Atual</p>
                        <p className={cn(
                          "text-2xl font-bold font-mono",
                          isNegative ? "text-destructive" : "text-success"
                        )}>
                          {formatCurrency(account.current_balance)}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {ACCOUNT_TYPE_LABELS[account.account_type]}
                        </Badge>
                      </div>

                      {/* Balance indicator */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-colors",
                            isNegative ? "bg-destructive" : "bg-success"
                          )}
                          style={{
                            width: `${Math.min(100, Math.abs(account.current_balance) / (Math.abs(totalBalance) || 1) * 100)}%`
                          }}
                        />
                      </div>

                      {/* Recent transactions */}
                      {accountTransactions.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Últimas movimentações
                          </p>
                          <div className="space-y-2">
                            {accountTransactions.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {t.type === "entrada" ? (
                                    <ArrowUpRight className="h-3 w-3 text-success shrink-0" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3 text-destructive shrink-0" />
                                  )}
                                  <span className="truncate text-muted-foreground">
                                    {t.description}
                                  </span>
                                </div>
                                <span className={cn(
                                  "font-mono text-xs shrink-0 ml-2",
                                  t.type === "entrada" ? "text-success" : "text-destructive"
                                )}>
                                  {t.type === "entrada" ? "+" : "-"}
                                  {formatCurrency(t.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Editar Conta" : "Nova Conta Bancária"}
              </DialogTitle>
              <DialogDescription>
                {editingAccount
                  ? "Atualize as informações da conta"
                  : "Preencha os dados da nova conta bancária"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Conta Principal, Caixa, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Banco</Label>
                <Select
                  value={formData.bank_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bank_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                    <SelectItem value="Itaú">Itaú</SelectItem>
                    <SelectItem value="Bradesco">Bradesco</SelectItem>
                    <SelectItem value="Santander">Santander</SelectItem>
                    <SelectItem value="Caixa">Caixa</SelectItem>
                    <SelectItem value="Nubank">Nubank</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="BTG">BTG Pactual</SelectItem>
                    <SelectItem value="C6 Bank">C6 Bank</SelectItem>
                    <SelectItem value="Sicoob">Sicoob</SelectItem>
                    <SelectItem value="Sicredi">Sicredi</SelectItem>
                    <SelectItem value="Safra">Safra</SelectItem>
                    <SelectItem value="Original">Original</SelectItem>
                    <SelectItem value="Next">Next</SelectItem>
                    <SelectItem value="Neon">Neon</SelectItem>
                    <SelectItem value="PicPay">PicPay</SelectItem>
                    <SelectItem value="Mercado Pago">Mercado Pago</SelectItem>
                    <SelectItem value="PagSeguro">PagSeguro</SelectItem>
                    <SelectItem value="Stone">Stone</SelectItem>
                    <SelectItem value="XP">XP Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) =>
                      setFormData({ ...formData, agency: e.target.value })
                    }
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Conta</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({ ...formData, account_number: e.target.value })
                    }
                    placeholder="00000-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_type">Tipo de Conta</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value: BankAccountType) =>
                    setFormData({ ...formData, account_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_balance">Saldo Inicial</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) =>
                    setFormData({ ...formData, initial_balance: e.target.value })
                  }
                  placeholder="0,00"
                />
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
                Tem certeza que deseja excluir a conta "{deletingAccount?.name}"?
                Esta ação não pode ser desfeita.
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
      </div>
    </AppLayout>
  );
}
