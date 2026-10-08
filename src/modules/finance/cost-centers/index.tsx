'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Building2, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCostCenters, CostCenter } from "./hooks/useCostCenters";
import { useCanEdit } from "@/hooks/useCanEdit";
import { CostCenterCard, CostCenterDialog } from "./components";

type FilterStatus = "all" | "active" | "inactive";

export default function CostCenters() {
  const { costCenters, isLoading, createCostCenter, updateCostCenter, deleteCostCenter } = useCostCenters();
  const canEdit = useCanEdit();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [deletingCostCenter, setDeletingCostCenter] = useState<CostCenter | null>(null);

  // Filter cost centers
  const filteredCostCenters = costCenters.filter((cc) => {
    const matchesSearch =
      cc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cc.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && cc.is_active) ||
      (filterStatus === "inactive" && !cc.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setIsDialogOpen(true);
  };

  const handleDelete = (costCenter: CostCenter) => {
    setDeletingCostCenter(costCenter);
  };

  const handleToggleActive = async (costCenter: CostCenter) => {
    await updateCostCenter(costCenter.id, { is_active: !costCenter.is_active });
  };

  const handleDialogSubmit = async (data: Parameters<typeof createCostCenter>[0]) => {
    if (editingCostCenter) {
      return await updateCostCenter(editingCostCenter.id, data);
    } else {
      return await createCostCenter(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingCostCenter) {
      await deleteCostCenter(deletingCostCenter.id);
      setDeletingCostCenter(null);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCostCenter(null);
    }
  };

  const activeCount = costCenters.filter((cc) => cc.is_active).length;
  const inactiveCount = costCenters.filter((cc) => !cc.is_active).length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PageHeader
              title="Centros de Custo"
              description="Gerencie centros de custo para agrupar despesas por projeto, obra ou área"
              actions={
                canEdit ? (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Centro
                  </Button>
                ) : undefined
              }
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3"
          >
            <Badge variant="outline" className="text-sm py-1.5 px-3">
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
              Total: {costCenters.length}
            </Badge>
            <Badge
              variant="outline"
              className="text-sm py-1.5 px-3 bg-success/10 text-success border-success/20"
            >
              Ativos: {activeCount}
            </Badge>
            {inactiveCount > 0 && (
              <Badge variant="secondary" className="text-sm py-1.5 px-3">
                Inativos: {inactiveCount}
              </Badge>
            )}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterStatus === "all" && "Todos"}
                  {filterStatus === "active" && "Ativos"}
                  {filterStatus === "inactive" && "Inativos"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                  Inativos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : filteredCostCenters.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchQuery || filterStatus !== "all"
                  ? "Nenhum centro de custo encontrado"
                  : "Nenhum centro de custo cadastrado"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || filterStatus !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Crie seu primeiro centro de custo para organizar despesas"}
              </p>
              {canEdit && !searchQuery && filterStatus === "all" && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Centro de Custo
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredCostCenters.map((costCenter, index) => (
                  <motion.div
                    key={costCenter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CostCenterCard
                      costCenter={costCenter}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                      canEdit={canEdit}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <CostCenterDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        costCenter={editingCostCenter}
        onSubmit={handleDialogSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCostCenter}
        onOpenChange={(open) => !open && setDeletingCostCenter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Centro de Custo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o centro de custo{" "}
              <strong>{deletingCostCenter?.name}</strong>?{" "}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
