'use client';

import { useState, useMemo } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryCard, CategoryDialog } from "./components";
import { useCategories, type Category, type CategoryInsert } from "./hooks/useCategories";
import { useCompany } from "@/contexts/CompanyContext";
import { useCanEdit } from "@/hooks/useCanEdit";
import { useAuth } from "@/contexts/AuthContext";

type TypeFilter = "all" | "receita" | "despesa" | "ambos";
type StatusFilter = "all" | "active" | "inactive";

export default function Categories() {
  const { currentCompany } = useCompany();
  const { hasRole, user } = useAuth();
  const canEdit = useCanEdit();
  const canDelete = hasRole("admin") || (user?.id && currentCompany?.created_by === user.id);
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
  } = useCategories();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || cat.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && cat.is_active) ||
        (statusFilter === "inactive" && !cat.is_active);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [categories, search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = (data: CategoryInsert | (Partial<CategoryInsert> & { id: string })) => {
    if ("id" in data) {
      updateCategory.mutate(data as { id: string } & Partial<CategoryInsert>, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createCategory.mutate(data as CategoryInsert, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id);
  };

  const handleToggleActive = (id: string, is_active: boolean) => {
    toggleActive.mutate({ id, is_active });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Categorias"
          description="Organize suas transações com categorias personalizadas"
          actions={
            canEdit ? (
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            ) : undefined
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma categoria encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {categories.length === 0
                ? "Crie sua primeira categoria para começar a organizar suas finanças."
                : "Tente ajustar os filtros de busca."}
            </p>
            {categories.length === 0 && canEdit && (
              <Button className="mt-4" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                canEdit={canEdit}
                canDelete={!!canDelete}
              />
            ))}
          </div>
        )}

        {/* Dialog */}
        {currentCompany && (
          <CategoryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            category={editingCategory}
            companyId={currentCompany.id}
            onSubmit={handleSubmit}
            isSubmitting={createCategory.isPending || updateCategory.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}
