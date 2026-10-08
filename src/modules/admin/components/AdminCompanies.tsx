'use client';

import { useState } from "react";
import { Building2, Plus, Pencil, Users, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyForm } from "@/components/shared";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminCompany } from "@/modules/admin/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminCompaniesProps {
  companies: AdminCompany[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AdminCompanies({ companies, isLoading, onRefresh }: AdminCompaniesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);

  const handleDelete = async (company: AdminCompany) => {
    if (!confirm(`Tem certeza que deseja remover a empresa "${company.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // IRON GATE: Verify user belongs to this company before deletion
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      const { data: membership } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('company_id', company.id)
        .maybeSingle();

      if (!membership) {
        toast.error('Empresa não encontrada');
        return;
      }

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;

      toast.success('Empresa removida com sucesso');
      onRefresh();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Erro ao remover empresa');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand" />
              Empresas
            </CardTitle>
            <CardDescription>
              Gerencie as empresas e filiais do sistema
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90">
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="animate-fade-in">
            <Table className="table-premium">
              <TableHeader>
                <TableRow className="border-brand/20">
                  <TableHead className="text-brand/80">Nome</TableHead>
                  <TableHead className="text-brand/80">CNPJ</TableHead>
                  <TableHead className="text-brand/80">Usuários</TableHead>
                  <TableHead className="text-brand/80">Tipo</TableHead>
                  <TableHead className="text-brand/80">Criada em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-brand/10 transition-colors hover:bg-brand/5"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                          <span className="text-brand font-bold">
                            {company.name[0]}
                          </span>
                        </div>
                        <div>
                          <p>{company.name}</p>
                          {company.trading_name && (
                            <p className="text-xs text-muted-foreground">
                              {company.trading_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.document || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-brand/60" />
                        <span>{company.user_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={company.is_headquarters 
                          ? "bg-brand/10 text-brand border-brand/30" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }
                      >
                        {company.is_headquarters ? "Matriz" : "Filial"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Opções da empresa">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(company)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma empresa cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Company Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>
              Cadastre uma nova empresa ou filial
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              onRefresh();
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados da empresa
            </DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <CompanyForm
              company={{
                id: editingCompany.id,
                name: editingCompany.name,
                trading_name: editingCompany.trading_name,
                document: editingCompany.document,
                email: editingCompany.email,
                phone: editingCompany.phone,
                address: null,
                city: null,
                state: null,
                zip_code: null,
                neighborhood: null,
                number: null,
                complement: null,
                currency: 'BRL',
                is_headquarters: editingCompany.is_headquarters,
                logo_url: null,
              }}
              onSuccess={() => {
                setEditingCompany(null);
                onRefresh();
              }}
              onCancel={() => setEditingCompany(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
