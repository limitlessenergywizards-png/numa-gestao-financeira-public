'use client';

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
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
import { Plus, Pencil, Trash2, Search, Landmark, UserCheck, Clock, TrendingUp, Tag, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid, StatItem } from "@/components/ui/stats-grid";
import { FilterBar } from "@/components/ui/filter-bar";
import { DocumentInput } from "@/components/ui/document-input";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/empty-state";
import { subDays } from "date-fns";

import {
    useCreditorsQueries,
    emptyFormData,
    type Creditor,
    type CreditorFormData,
} from "./hooks/useCreditorsQueries";

const CREDITOR_CATEGORIES = [
    { value: "banco", label: "Banco", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { value: "cartao_credito", label: "Cartão de Crédito", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    { value: "financeira", label: "Financeira", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    { value: "fornecedor", label: "Fornecedor", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    { value: "governo", label: "Governo (Impostos)", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    { value: "socio", label: "Sócio", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    { value: "cliente", label: "Cliente (Reembolso/Estorno)", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
    { value: "outro", label: "Outro", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
] as const;

const getCategoryConfig = (category: string | null) => {
    return CREDITOR_CATEGORIES.find((c) => c.value === category) || null;
};

export default function CreditorsPage() {
    const { currentCompany } = useCompany();
    const { hasRole } = useAuth();

    const {
        creditors,
        isLoading,
        saveMutation,
        deleteMutation,
    } = useCreditorsQueries(currentCompany?.id);

    // UI state
    const [searchInput, setSearchInput] = useState("");
    const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);
    const [showInactive, setShowInactive] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingCreditor, setEditingCreditor] = useState<Creditor | null>(null);
    const [deletingCreditor, setDeletingCreditor] = useState<Creditor | null>(null);
    const [formData, setFormData] = useState<CreditorFormData>(emptyFormData);

    const canEdit = useCanEdit();
    const canDelete = canEdit; // Allow delete if user can edit (admin, editor, or owner)

    function handleNewCreditor() {
        setEditingCreditor(null);
        setFormData(emptyFormData);
        setIsDialogOpen(true);
    }

    function handleEditCreditor(creditor: Creditor) {
        setEditingCreditor(creditor);
        setFormData({
            name: creditor.name,
            document: creditor.document || "",
            email: creditor.email || "",
            phone: creditor.phone || "",
            address: creditor.address || "",
            city: creditor.city || "",
            state: creditor.state || "",
            zip_code: creditor.zip_code || "",
            notes: creditor.notes || "",
            category: creditor.category || "",
            is_active: creditor.is_active,
        });
        setIsDialogOpen(true);
    }

    function handleDeleteClick(creditor: Creditor) {
        setDeletingCreditor(creditor);
        setIsDeleteDialogOpen(true);
    }

    async function handleSave() {
        if (!currentCompany || !formData.name.trim()) return;

        saveMutation.mutate(
            { formData, editingId: editingCreditor?.id },
            { onSuccess: () => setIsDialogOpen(false) }
        );
    }

    async function handleDelete() {
        if (!deletingCreditor) return;

        deleteMutation.mutate(deletingCreditor.id, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSuccess: (data: any) => {
                setIsDeleteDialogOpen(false);
                setDeletingCreditor(null);
                // Note: Specific toast messages are handled in useCreditorsQueries.ts
            },
        });
    }

    const filteredCreditors = useMemo(() => {
        return creditors.filter((creditor) => {
            const matchesSearch =
                creditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                creditor.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                creditor.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = showInactive || creditor.is_active;

            return matchesSearch && matchesStatus;
        });
    }, [creditors, searchTerm, showInactive]);

    const stats: StatItem[] = useMemo(() => {
        const activeCount = creditors.filter((s) => s.is_active).length;
        const recentCount = creditors.filter((s) => {
            const createdDate = new Date(s.created_at);
            return createdDate >= subDays(new Date(), 30);
        }).length;

        return [
            {
                title: "Total de Credores",
                value: creditors.length,
                icon: Landmark,
                color: "teal",
            },
            {
                title: "Credores Ativos",
                value: activeCount,
                icon: UserCheck,
                color: "success",
            },
            {
                title: "Novos Registros (30d)",
                value: recentCount,
                icon: TrendingUp,
                color: "primary",
            },
            {
                title: "Instituições Financeiras",
                value: creditors.filter(c => c.category === 'banco' || c.category === 'financeira').length,
                icon: Landmark,
                color: "info",
            },
        ];
    }, [creditors]);

    // Pagination
    const totalPages = Math.ceil(filteredCreditors.length / itemsPerPage);
    const paginatedCreditors = filteredCreditors.slice(
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
                    Selecione uma empresa para gerenciar credores.
                </p>
            </div>
        );
    }

    return (
        <AppLayout title="Credores" description="Gerencie credores e instituições financeiras">
            <div className="space-y-6 animate-fade-in">
                <div>
                    <PageHeader
                        title="Credores"
                        description="Gerencie credores, bancos e financeiras"
                        actions={
                            canEdit && (
                                <Button onClick={handleNewCreditor}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Credor
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
                ) : filteredCreditors.length === 0 ? (
                    <EmptyState
                        icon={Landmark}
                        title="Nenhum credor encontrado"
                        description={
                            searchTerm
                                ? "Tente ajustar sua busca"
                                : "Comece adicionando seu primeiro credor"
                        }
                        action={
                            canEdit && !searchTerm
                                ? { label: "Novo Credor", onClick: handleNewCreditor }
                                : undefined
                        }
                    />
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                        <div
                            className="dark flex items-center justify-between px-5 py-3.5 border-b border-emerald-800/30"
                            style={{
                                background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
                                boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-medium text-emerald-100/90">
                                    Lista de Credores
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="font-normal text-xs border-emerald-700/40 text-emerald-300/80 bg-emerald-900/20"
                                >
                                    {filteredCreditors.length} {filteredCreditors.length === 1 ? 'registro' : 'registros'}
                                </Badge>
                            </div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-emerald-800/20 scrollbar-track-transparent">
                            <Table>
                                <TableHeader className="sticky top-0 z-30 shadow-md bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059]">
                                    <TableRow className="!bg-transparent border-b border-white/10">
                                        <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 text-center !bg-transparent">Credor</TableHead>
                                        <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 text-center !bg-transparent">Categoria</TableHead>
                                        <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 hidden md:table-cell text-center !bg-transparent">Documento</TableHead>
                                        <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 hidden lg:table-cell text-center !bg-transparent">Email</TableHead>
                                        <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 hidden xl:table-cell text-center !bg-transparent">Telefone</TableHead>
                                        <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 text-center !bg-transparent">Status</TableHead>
                                        {canEdit && <TableHead className="!text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap py-4 px-6 w-[100px] text-center !bg-transparent">Ações</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCreditors.map((creditor) => {
                                        const categoryConfig = getCategoryConfig(creditor.category);
                                        return (
                                            <TableRow key={creditor.id} className="hover:bg-muted/30">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <AvatarInitials name={creditor.name} size="sm" />
                                                        <span className="font-medium">{creditor.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {categoryConfig ? (
                                                        <Badge variant="outline" className={cn(categoryConfig.color, "mx-auto")}>
                                                            <Tag className="h-3 w-3 mr-1" />
                                                            {categoryConfig.label}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell font-mono text-sm text-center">
                                                    {creditor.document || "-"}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-center">
                                                    {creditor.email || "-"}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell text-center">
                                                    {creditor.phone || "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={creditor.is_active ? "default" : "secondary"}
                                                        className={creditor.is_active ? "bg-success/10 text-success border-success/20 mx-auto" : "mx-auto"}
                                                    >
                                                        {creditor.is_active ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </TableCell>
                                                {canEdit && (
                                                    <TableCell>
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
                                                                        onClick={() => handleEditCreditor(creditor)}
                                                                        className="cursor-pointer hover:bg-[#C5A059]/10 focus:bg-[#C5A059]/20 text-emerald-100/90"
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        <span>Editar</span>
                                                                    </DropdownMenuItem>
                                                                    {canDelete && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteClick(creditor)}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                                    {Math.min(currentPage * itemsPerPage, filteredCreditors.length)} de{" "}
                                    {filteredCreditors.length} credores
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
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
                                                    className="w-8 h-8 p-0"
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
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCreditor ? "Editar Credor" : "Novo Credor"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCreditor
                                    ? "Atualize as informações do credor"
                                    : "Preencha os dados do novo credor"}
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
                                        placeholder="Ex: Banco Central S.A."
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
                                    <Label>Tipo/Categoria</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, category: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CREDITOR_CATEGORIES.map((cat) => (
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
                                        placeholder="email@banco.com.br"
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
                                    placeholder="Avenida Faria Lima, 1000 - Andar 5"
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
                                        placeholder="São Paulo"
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
                                        placeholder="SP"
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
                                    placeholder="Anotações adicionais (Gerente de conta, número do contrato matriz etc.)"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_active: checked })
                                    }
                                />
                                <Label htmlFor="is_active">Credor ativo no sistema</Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? "Salvando..." : "Salvar Credor"}
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
                                Tem certeza que deseja excluir o credor "{deletingCreditor?.name}"?
                                Esta ação também pode afetar o histórico se existirem dívidas vinculadas utilizando este nome.
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
