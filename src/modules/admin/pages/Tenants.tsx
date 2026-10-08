'use client';

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { TIMING } from "@/lib/config";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useAdminData } from "@/modules/admin/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/ui/filter-bar";
import { TenantCard } from "../components/TenantCard";
import { ImpersonateDialog } from "../components/ImpersonateDialog";
import {
  Building2,
  Search,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { differenceInDays } from "date-fns";

export default function AdminTenants() {
  const { companies, users, subscriptions, isLoading, refresh } = useAdminData();
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);

  // Enrich companies with status and metrics
  const enrichedTenants = useMemo(() => {
    return companies.map(company => {
      // Find users associated with this company
      const companyUsers = users.filter(u =>
        u.companies.some(c => c.company_id === company.id)
      );

      // Find active subscription for company owner
      const ownerUser = companyUsers.find(u =>
        u.companies.some(c => c.company_id === company.id && c.role === 'admin')
      );

      const subscription = subscriptions.find(s =>
        s.user_id === ownerUser?.user_id && s.status === 'active'
      );

      // Determine status
      let status: 'active' | 'trial' | 'inactive' | 'overdue' = 'inactive';
      let planName = 'Gratuito';
      let trialDaysLeft = 0;

      if (subscription) {
        status = 'active';
        planName = subscription.plan_name || 'Iniciante';
      } else if (ownerUser?.trial_started_at) {
        const trialStart = new Date(ownerUser.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();
        if (trialEnd > now) {
          status = 'trial';
          trialDaysLeft = differenceInDays(trialEnd, now);
          planName = 'Trial';
        }
      }

      // Get last activity from users
      const lastActivity = companyUsers
        .filter(u => u.last_activity_date)
        .sort((a, b) => new Date(b.last_activity_date!).getTime() - new Date(a.last_activity_date!).getTime())[0]
        ?.last_activity_date;

      return {
        ...company,
        status,
        planName,
        trialDaysLeft,
        usersCount: companyUsers.length,
        lastActivity,
        ownerUserId: ownerUser?.user_id,
        ownerEmail: ownerUser?.email,
        ownerName: ownerUser?.full_name,
      };
    });
  }, [companies, users, subscriptions]);

  // Filter tenants
  const filteredTenants = useMemo(() => {
    return enrichedTenants.filter(tenant => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.trading_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.document?.includes(searchTerm) ||
        tenant.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
      const matchesPlan = planFilter === "all" ||
        tenant.planName.toLowerCase().includes(planFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [enrichedTenants, searchTerm, statusFilter, planFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: enrichedTenants.length,
    active: enrichedTenants.filter(t => t.status === 'active').length,
    trial: enrichedTenants.filter(t => t.status === 'trial').length,
    inactive: enrichedTenants.filter(t => t.status === 'inactive').length,
    atRisk: enrichedTenants.filter(t => t.status === 'trial' && t.trialDaysLeft <= 3).length,
  }), [enrichedTenants]);

  const handleImpersonate = (userId: string) => {
    setSelectedUserId(userId);
    setImpersonateDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setPlanFilter("all");
  };

  const hasFilters = searchInput || statusFilter !== "all" || planFilter !== "all";

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-16" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Gestão de Tenants
            </h1>
            <p className="text-muted-foreground">
              Gerencie todas as empresas da plataforma
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
              <Building2 className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Trial
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.trial}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Risco
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{stats.atRisk}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div>
          <FilterBar onClear={clearFilters} showClear={Boolean(hasFilters)}>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="trial">Em Trial</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="estrategista">Estrategista</SelectItem>
                <SelectItem value="mestre">Mestre</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </div>

        {/* Results count */}
        <div>
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredTenants.length} de {enrichedTenants.length} empresas
          </p>
        </div>

        {/* Tenants Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant, index) => (
            <div key={tenant.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}>
              <TenantCard
                tenant={tenant}
                onImpersonate={handleImpersonate}
                onRefresh={refresh}
              />
            </div>
          ))}
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Nenhuma empresa encontrada com os filtros aplicados
            </p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* Impersonate Dialog */}
        <ImpersonateDialog
          open={impersonateDialogOpen}
          onOpenChange={setImpersonateDialogOpen}
          targetUserId={selectedUserId}
          users={users}
        />
      </div>
    </SuperAdminLayout>
  );
}
