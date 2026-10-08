'use client';

import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { TIMING } from "@/lib/config";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCanEdit } from "@/hooks/useCanEdit";
import {
  useCustomersQuery,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  Customer
} from "./hooks/useCustomersQuery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, UserCheck, Clock, TrendingUp, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid, StatItem } from "@/components/ui/stats-grid";
import { FilterBar } from "@/components/ui/filter-bar";
import { DocumentInput } from "@/components/ui/document-input";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualTable, ColumnDef } from "@/components/ui/virtual-table";
import { subDays } from "date-fns";
import { getRLSErrorMessage } from "@/lib/errorUtils";

interface CustomerFormData {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
  is_active: boolean;
}

const emptyFormData: CustomerFormData = {
  name: "",
  document: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  notes: "",
  is_active: true,
};

export default function Customers() {
  const { currentCompany } = useCompany();
  const { hasRole } = useAuth();
  const companyId = currentCompany?.id;

  // React Query hooks
  const { data: customers = [], isLoading } = useCustomersQuery(companyId);
  const createMutation = useCreateCustomer(companyId);
  const updateMutation = useUpdateCustomer(companyId);
  const deleteMutation = useDeleteCustomer(companyId);

  // Pending receivables count query
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['customers', 'pending-receivables', companyId],
    queryFn: async ({ signal }) => {
      if (!companyId) return 0;
      const { count } = await supabase
        .from("receivables")
        .select("customer_id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .in("status", ["pendente", "parcial"])
        .abortSignal(signal);
      return count || 0;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Local UI state
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);
  const [showInactive, setShowInactive] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyFormData);

  const canEdit = useCanEdit();
  const canDelete = canEdit; // Allow delete if user can edit (admin, editor, or owner)
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  function handleNewCustomer() {
    setEditingCustomer(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      document: customer.document || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      zip_code: customer.zip_code || "",
      notes: customer.notes || "",
      is_active: customer.is_active,
    });
    setIsDialogOpen(true);
  }

  function handleDeleteClick(customer: Customer) {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  }

  function handleSave() {
    if (!companyId) return;

    if (!formData.name.trim()) {
      toast.error("Nome obrigatório", { description: "Por favor, informe o nome do cliente." });
      return;
    }

    const customerData = {
      name: formData.name.trim(),
      document: formData.document.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      zip_code: formData.zip_code.trim() || null,
      notes: formData.notes.trim() || null,
      is_active: formData.is_active,
    };

    const onSuccess = () => {
      toast.success(editingCustomer ? "Cliente atualizado" : "Cliente criado", {
        description: `${formData.name} foi ${editingCustomer ? "atualizado" : "adicionado"} com sucesso.`,
      });
      setIsDialogOpen(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (error: any) => {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente", { description: getRLSErrorMessage(error) });
    };

    if (editingCustomer) {
      updateMutation.mutate(
        { id: editingCustomer.id, payload: customerData },
        { onSuccess, onError }
      );
    } else {
      createMutation.mutate(
        { company_id: companyId, ...customerData },
        { onSuccess, onError }
      );
    }
  }

  function handleDelete() {
    if (!deletingCustomer) return;

    deleteMutation.mutate(deletingCustomer.id, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (data: any) => {
        if (data?.type === "soft") {
          toast.success("Cliente inativado", {
            description: "O cliente possui transações vinculadas e não pode ser excluído permanentemente. Por conta disso, ele foi desativado.",
          });
        } else {
          toast.success("Cliente excluído", {
            description: `${deletingCustomer.name} foi excluído com sucesso.`,
          });
        }
        setIsDeleteDialogOpen(false);
        setDeletingCustomer(null);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        console.error("Erro ao excluir cliente:", error);
        toast.error("Erro ao excluir cliente", { description: getRLSErrorMessage(error) });
      },
    });
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = showInactive || customer.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, showInactive]);

  // Stats
  const stats: StatItem[] = useMemo(() => {
    const activeCount = customers.filter((c) => c.is_active).length;
    const recentCount = customers.filter((c) => {
      const createdDate = new Date(c.created_at);
      return createdDate >= subDays(new Date(), 30);
    }).length;

    return [
      {
        title: "Total de Clientes",
        value: customers.length,
        icon: Users,
        color: "teal",
      },
      {
        title: "Clientes Ativos",
        value: activeCount,
        icon: UserCheck,
        color: "success",
      },
      {
        title: "Com Recebíveis Pendentes",
        value: pendingCount,
        icon: Clock,
        color: "warning",
      },
      {
        title: "Novos (30 dias)",
        value: recentCount,
        icon: TrendingUp,
        color: "info",
      },
    ];
  }, [customers, pendingCount]);

  // Handlers para VirtualTable
  const handleEditClick = useCallback((customer: Customer) => {
    handleEditCustomer(customer);
  }, []);

  const handleDeleteClickMemo = useCallback((customer: Customer) => {
    handleDeleteClick(customer);
  }, []);

  // Definição de colunas para VirtualTable
  const columns: ColumnDef<Customer>[] = useMemo(() => {
    const baseColumns: ColumnDef<Customer>[] = [
      {
        id: 'name',
        header: 'Cliente',
        cell: (customer) => (
          <div className="flex items-center gap-3">
            <AvatarInitials name={customer.name} size="sm" />
            <span className="font-medium">{customer.name}</span>
          </div>
        ),
        width: 200,
        minWidth: 150,
      },
      {
        id: 'document',
        header: 'Documento',
        cell: (customer) => (
          <span className="font-mono text-sm">{customer.document || "-"}</span>
        ),
        width: 150,
        align: 'center',
      },
      {
        id: 'email',
        header: 'Email',
        cell: (customer) => customer.email || "-",
        hideOnMobile: true,
        align: 'center',
      },
      {
        id: 'phone',
        header: 'Telefone',
        cell: (customer) => customer.phone || "-",
        hideOnMobile: true,
        hideOnTablet: true,
        align: 'center',
      },
      {
        id: 'location',
        header: 'Cidade/UF',
        cell: (customer) =>
          customer.city && customer.state
            ? `${customer.city}/${customer.state}`
            : customer.city || customer.state || "-",
        hideOnMobile: true,
        hideOnTablet: true,
        align: 'center',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (customer) => (
          <Badge
            variant={customer.is_active ? "default" : "secondary"}
            className={customer.is_active ? "bg-success/10 text-success border-success/20" : ""}
          >
            {customer.is_active ? "Ativo" : "Inativo"}
          </Badge>
        ),
        width: 100,
        align: 'center',
      },
    ];

    if (canEdit) {
      baseColumns.push({
        id: 'actions',
        header: 'Ações',
        cell: (customer) => (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#C5A059]/10 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-[#0a1a12]/95 border-emerald-800/30 backdrop-blur-sm">
                <DropdownMenuItem
                  onClick={() => handleEditClick(customer)}
                  className="cursor-pointer hover:bg-[#C5A059]/10 focus:bg-[#C5A059]/20 text-emerald-100/90"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => handleDeleteClickMemo(customer)}
                    className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/20"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Excluir</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        width: 100,
        align: 'center',
      });
    }

    return baseColumns;
  }, [canEdit, canDelete, handleEditClick, handleDeleteClickMemo]);

  const clearFilters = () => {
    setSearchInput("");
    setShowInactive(false);
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Selecione uma empresa para gerenciar clientes.
        </p>
      </div>
    );
  }

  return (
    <AppLayout title="Clientes" description="Gerencie sua base de clientes">
      <div className="space-y-6 animate-fade-in">
        <div>
          <PageHeader
            title="Clientes"
            description="Gerencie os clientes da sua empresa"
            actions={
              canEdit && (
                <Button onClick={handleNewCustomer}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              )
            }
          />
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <StatsGrid stats={stats} columns={4} variant="vibrant" />
        </div>

        <FilterBar onClear={clearFilters} showClear={searchInput !== "" || showInactive}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Mostrar inativos
            </Label>
          </div>
        </FilterBar>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description={
              searchTerm
                ? "Tente ajustar sua busca"
                : "Comece adicionando seu primeiro cliente"
            }
            action={
              canEdit && !searchTerm
                ? { label: "Novo Cliente", onClick: handleNewCustomer }
                : undefined
            }
          />
        ) : (
          <VirtualTable
            data={filteredCustomers}
            columns={columns}
            getRowKey={(customer) => customer.id}
            rowHeight={56}
            containerHeight={500}
            isLoading={isLoading}
            headerClassName="bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059]"
            headerBar={
              <div
                className="dark flex items-center justify-between px-5 py-3.5 border-b border-emerald-800/30"
                style={{
                  background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
                  boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium text-emerald-100/90">
                    Lista de Clientes
                  </h3>
                  <Badge
                    variant="outline"
                    className="font-normal text-xs border-emerald-700/40 text-emerald-300/80 bg-emerald-900/20"
                  >
                    {filteredCustomers.length} {filteredCustomers.length === 1 ? 'registro' : 'registros'}
                  </Badge>
                </div>
              </div>
            }
            emptyState={
              <EmptyState
                icon={Users}
                title="Nenhum cliente encontrado"
                description="Comece adicionando seu primeiro cliente"
              />
            }
          />
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Atualize as informações do cliente"
                  : "Preencha os dados do novo cliente"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <DocumentInput
                    value={formData.document}
                    onChange={(value) =>
                      setFormData({ ...formData, document: value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) =>
                      setFormData({ ...formData, zip_code: e.target.value })
                    }
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Anotações sobre o cliente..."
                  rows={3}
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
                <Label htmlFor="is_active">Cliente ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
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
                Tem certeza que deseja excluir o cliente "{deletingCustomer?.name}"?
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
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
