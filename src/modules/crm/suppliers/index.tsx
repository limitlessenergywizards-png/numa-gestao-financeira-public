'use client';

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { TIMING } from "@/lib/config";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCanEdit } from "@/hooks/useCanEdit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
  UserCheck,
  Clock,
  TrendingUp,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid, StatItem } from "@/components/ui/stats-grid";
import { FilterBar } from "@/components/ui/filter-bar";
import { DocumentInput } from "@/components/ui/document-input";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/empty-state";
import { subDays } from "date-fns";

import {
  useSuppliersQueries,
  emptyFormData,
  type Supplier,
  type SupplierFormData,
} from "./hooks/useSuppliersQueries";

const SUPPLIER_CATEGORIES = [
  { value: "servicos", label: "Serviços", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "materiais", label: "Materiais", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "tecnologia", label: "Tecnologia", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "logistica", label: "Logística", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  { value: "marketing", label: "Marketing", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  { value: "financeiro", label: "Financeiro", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "outros", label: "Outros", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
] as const;

const getCategoryConfig = (category: string | null) => {
  return SUPPLIER_CATEGORIES.find((c) => c.value === category) || null;
};

export default function Suppliers() {
  const { currentCompany } = useCompany();
  const { hasRole } = useAuth();

  // Feature hook - all data fetching via React Query
  const {
    suppliers,
    pendingCount,
    totalPending,
    isLoading,
    saveMutation,
    deleteMutation,
  } = useSuppliersQueries(currentCompany?.id);

  // UI state
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyFormData);

  const canEdit = useCanEdit();
  const canDelete = canEdit; // Allow delete if user can edit (admin, editor, or owner)

  function handleNewSupplier() {
    setEditingSupplier(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  }

  function handleEditSupplier(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      document: supplier.document || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zip_code: supplier.zip_code || "",
      notes: supplier.notes || "",
      category: supplier.category || "",
      is_active: supplier.is_active,
    });
    setIsDialogOpen(true);
  }

  function handleDeleteClick(supplier: Supplier) {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!currentCompany || !formData.name.trim()) return;

    saveMutation.mutate(
      { formData, editingId: editingSupplier?.id },
      { onSuccess: () => setIsDialogOpen(false) }
    );
  }

  async function handleDelete() {
    if (!deletingSupplier) return;

    deleteMutation.mutate(deletingSupplier.id, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (data: any) => {
        setIsDeleteDialogOpen(false);
        setDeletingSupplier(null);
        // Note: The specific toast messages for soft/hard delete are already 
        // handled globally in the useSuppliersQueries.ts deleteMutation onSuccess.
        // We just need to ensure we're passing the data and closing the dialog.
      },
    });
  }

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = showInactive || supplier.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, showInactive]);

  const stats: StatItem[] = useMemo(() => {
    const activeCount = suppliers.filter((s) => s.is_active).length;
    const recentCount = suppliers.filter((s) => {
      const createdDate = new Date(s.created_at);
      return createdDate >= subDays(new Date(), 30);
    }).length;

    const formatCurrency = (value: number) =>
      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return [
      {
        title: "Total de Fornecedores",
        value: suppliers.length,
        icon: Building2,
        color: "teal",
      },
      {
        title: "Fornecedores Ativos",
        value: activeCount,
        icon: UserCheck,
        color: "success",
      },
      {
        title: "Com Pagáveis Pendentes",
        value: pendingCount,
        icon: Clock,
        color: "warning",
      },
      {
        title: "Total em Aberto",
        value: formatCurrency(totalPending),
        icon: TrendingUp,
        color: "destructive",
      },
    ];
  }, [suppliers, pendingCount, totalPending]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchInput("");
    setShowInactive(false);
    setCurrentPage(1);
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Selecione uma empresa para gerenciar fornecedores.
        </p>
      </div>
    );
  }

  return (
    <AppLayout title="Fornecedores" description="Gerencie seus fornecedores">
      <div className="space-y-6 animate-fade-in">
        <div>
          <PageHeader
            title="Fornecedores"
            description="Gerencie os fornecedores da sua empresa"
            actions={
              canEdit && (
                <Button onClick={handleNewSupplier}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Fornecedor
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
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={(checked) => {
                setShowInactive(checked);
                setCurrentPage(1);
              }}
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
        ) : filteredSuppliers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum fornecedor encontrado"
            description={
              searchTerm
                ? "Tente ajustar sua busca"
                : "Comece adicionando seu primeiro fornecedor"
            }
            action={
              canEdit && !searchTerm
                ? { label: "Novo Fornecedor", onClick: handleNewSupplier }
                : undefined
            }
          />
        ) : (
          <>
            <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden min-h-[480px] bg-background dark:border-emerald-900/40">
              {/* Header bar - matching the premium pattern */}
              <div
                className="dark flex items-center justify-between px-5 py-3.5 border-b border-emerald-800/30"
                style={{
                  background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
                  boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium text-emerald-100/90">
                    Lista de Fornecedores
                  </h3>
                  <Badge
                    variant="outline"
                    className="font-normal text-xs border-emerald-700/40 text-emerald-300/80 bg-emerald-900/20"
                  >
                    {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'registro' : 'registros'}
                  </Badge>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-emerald-800/20 scrollbar-track-transparent">
                <Table>
                  <TableHeader className="sticky top-0 z-30 shadow-md bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059]">
                    <TableRow className="!bg-transparent border-b border-white/10">
                      <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 text-center !bg-transparent">Fornecedor</TableHead>
                      <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 text-center !bg-transparent">Categoria</TableHead>
                      <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 hidden md:table-cell text-center !bg-transparent">Documento</TableHead>
                      <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 hidden lg:table-cell text-center !bg-transparent">Email</TableHead>
                      <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 hidden xl:table-cell text-center !bg-transparent">Telefone</TableHead>
                      <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 text-center !bg-transparent">Status</TableHead>
                      {canEdit && <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 w-[100px] text-center !bg-transparent">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSuppliers.map((supplier) => {
                      const categoryConfig = getCategoryConfig(supplier.category);
                      return (
                        <TableRow key={supplier.id} className="hover:bg-[#C5A059]/5 border-b border-border/40 transition-colors">
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <AvatarInitials name={supplier.name} size="sm" />
                              <span className="font-semibold text-foreground/90">{supplier.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              {categoryConfig ? (
                                <Badge variant="outline" className={`${categoryConfig.color} font-medium`}>
                                  <Tag className="h-3 w-3 mr-1" />
                                  {categoryConfig.label}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm text-center px-6 py-4 text-muted-foreground">
                            {supplier.document || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell px-6 py-4 text-center text-muted-foreground">
                            {supplier.email || "-"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell px-6 py-4 text-center text-muted-foreground">
                            {supplier.phone || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <Badge
                                variant={supplier.is_active ? "default" : "secondary"}
                                className={supplier.is_active ? "bg-success/10 text-success border-success/20 font-medium" : "font-medium"}
                              >
                                {supplier.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </TableCell>
                          {canEdit && (
                            <TableCell className="px-6 py-4">
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
                                      onClick={() => handleEditSupplier(supplier)}
                                      className="cursor-pointer hover:bg-[#C5A059]/10 focus:bg-[#C5A059]/20 text-emerald-100/90"
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      <span>Editar</span>
                                    </DropdownMenuItem>
                                    {canDelete && (
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteClick(supplier)}
                                        className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/20"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Excluir</span>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                  <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}</span> de{" "}
                  <span className="font-medium text-foreground">{filteredSuppliers.length}</span> fornecedores
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={`w-9 h-9 p-0 font-medium ${currentPage === pageNum ? 'bg-[#C5A059] hover:bg-[#B48F48] text-[#1a1a1a]' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier
                  ? "Atualize as informações do fornecedor"
                  : "Preencha os dados do novo fornecedor"}
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
                    placeholder="Nome do fornecedor"
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
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  placeholder="Anotações sobre o fornecedor..."
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
                <Label htmlFor="is_active">Fornecedor ativo</Label>
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
                Tem certeza que deseja excluir o fornecedor "{deletingSupplier?.name}"?
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
