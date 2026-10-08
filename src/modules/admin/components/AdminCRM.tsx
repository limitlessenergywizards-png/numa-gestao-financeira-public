'use client';

import { useState, useMemo } from "react";
import {
  Users, Package, Search, Building2, UserCheck, UserX,
  TrendingUp, Award, RefreshCw, Filter, Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminCRM } from "../hooks/useAdminCRM";
import type { AdminCustomer, AdminSupplier } from "../hooks/useAdminCRM";

const CATEGORY_LABELS: Record<string, string> = {
  servicos: "Serviços",
  materiais: "Materiais",
  tecnologia: "Tecnologia",
  logistica: "Logística",
  marketing: "Marketing",
  financeiro: "Financeiro",
  outros: "Outros",
  banco: "Banco",
  financeira: "Financeira",
  cartao_credito: "Cartão de Crédito",
  socio: "Sócio",
  governo: "Governo",
};

const CATEGORY_COLORS: Record<string, string> = {
  servicos: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  materiais: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  tecnologia: "bg-violet-500/10 text-violet-500 border-violet-500/30",
  logistica: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  marketing: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  financeiro: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  banco: "bg-sky-500/10 text-sky-500 border-sky-500/30",
  financeira: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  cartao_credito: "bg-rose-500/10 text-rose-500 border-rose-500/30",
  socio: "bg-teal-500/10 text-teal-500 border-teal-500/30",
  governo: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

const PAGE_SIZE = 20;

export function AdminCRM() {
  const { customers, suppliers, stats, isLoading, refresh } = useAdminCRM();
  const [crmTab, setCrmTab] = useState("customers");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [custPage, setCustPage] = useState(0);
  const [suppPage, setSuppPage] = useState(0);

  // Unique companies for filter
  const companyOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const c of customers) set.set(c.company_id, c.company_name);
    for (const s of suppliers) set.set(s.company_id, s.company_name);
    return Array.from(set.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, suppliers]);

  // Filter logic
  const filterEntity = <T extends { name: string; document: string | null; email: string | null; company_id: string; is_active: boolean }>(
    items: T[]
  ): T[] => {
    let filtered = items;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        i => i.name.toLowerCase().includes(q) ||
          i.document?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q)
      );
    }
    if (companyFilter !== "all") {
      filtered = filtered.filter(i => i.company_id === companyFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(i =>
        statusFilter === "active" ? i.is_active : !i.is_active
      );
    }
    return filtered;
  };

  const filteredCustomers = useMemo(() => filterEntity(customers), [customers, search, companyFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredSuppliers = useMemo(() => filterEntity(suppliers), [suppliers, search, companyFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const pagedCustomers = filteredCustomers.slice(custPage * PAGE_SIZE, (custPage + 1) * PAGE_SIZE);
  const pagedSuppliers = filteredSuppliers.slice(suppPage * PAGE_SIZE, (suppPage + 1) * PAGE_SIZE);
  const totalCustPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const totalSuppPages = Math.ceil(filteredSuppliers.length / PAGE_SIZE);

  // Reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setCustPage(0); setSuppPage(0); };
  const handleCompanyFilter = (v: string) => { setCompanyFilter(v); setCustPage(0); setSuppPage(0); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setCustPage(0); setSuppPage(0); };

  // CSV export
  const exportCSV = (type: "customers" | "suppliers") => {
    const items = type === "customers" ? filteredCustomers : filteredSuppliers;
    const headers = type === "customers"
      ? ["Nome", "Documento", "Email", "Telefone", "Cidade", "Estado", "Empresa", "Status", "Criado em"]
      : ["Nome", "Documento", "Email", "Telefone", "Categoria", "Cidade", "Estado", "Empresa", "Status", "Criado em"];

    const rows = items.map(i => {
      const base = [
        i.name,
        i.document || "",
        i.email || "",
        (i as AdminCustomer).phone || "",
      ];
      if (type === "suppliers") {
        base.push(CATEGORY_LABELS[(i as AdminSupplier).category || ""] || (i as AdminSupplier).category || "");
      }
      base.push(
        (i as AdminCustomer).city || "",
        (i as AdminCustomer).state || "",
        (i as AdminCustomer).company_name,
        i.is_active ? "Ativo" : "Inativo",
        new Date(i.created_at).toLocaleDateString("pt-BR"),
      );
      return base;
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Clientes",
      value: stats.totalCustomers,
      sub: `${stats.activeCustomers} ativos`,
      icon: Users,
      color: "text-brand",
      bgColor: "bg-brand/10",
      borderColor: "border-brand/30",
    },
    {
      title: "Fornecedores",
      value: stats.totalSuppliers,
      sub: `${stats.activeSuppliers} ativos`,
      icon: Package,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Novos (30d)",
      value: stats.recentCustomers + stats.recentSuppliers,
      sub: `${stats.recentCustomers} clientes, ${stats.recentSuppliers} fornecedores`,
      icon: TrendingUp,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
    },
    {
      title: "Empresas c/ CRM",
      value: Math.max(stats.companiesWithCustomers, stats.companiesWithSuppliers),
      sub: stats.topCompanyByCustomers
        ? `Top: ${stats.topCompanyByCustomers.name}`
        : "Nenhuma empresa",
      icon: Award,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
            <Card className={`bg-card dark:bg-[#17322C]/80 backdrop-blur border ${stat.borderColor} hover:border-brand/50 transition-[border-color,box-shadow] hover:shadow-lg hover:shadow-brand/5`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* CRM Table */}
      <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand" />
                Gestão de CRM Global
              </CardTitle>
              <CardDescription>Clientes e fornecedores de todas as empresas</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refresh()} className="gap-2 border-brand/20 hover:border-brand/40">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, documento ou email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={companyFilter} onValueChange={handleCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companyOptions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={crmTab} onValueChange={(v) => { setCrmTab(v); setCustPage(0); setSuppPage(0); }}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted dark:bg-[#132925] border border-border dark:border-brand/20">
                <TabsTrigger value="customers" className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                  <Users className="h-4 w-4" />
                  Clientes ({filteredCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                  <Package className="h-4 w-4" />
                  Fornecedores ({filteredSuppliers.length})
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-brand hover:text-brand"
                onClick={() => exportCSV(crmTab as "customers" | "suppliers")}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Customers Table */}
            <TabsContent value="customers" className="mt-0">
              <div className="rounded-lg border border-border dark:border-brand/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 dark:bg-[#132925]/50">
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Documento</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Criado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedCustomers.map((c) => (
                      <TableRow key={c.id} className="hover:bg-brand/5">
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c.document || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm truncate max-w-[180px]">{c.email || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {c.city && c.state ? `${c.city}/${c.state}` : c.city || c.state || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-brand/20 text-brand font-normal">
                            {c.company_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                              <UserCheck className="h-3 w-3 mr-1" />Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <UserX className="h-3 w-3 mr-1" />Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pagedCustomers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {search || companyFilter !== "all" || statusFilter !== "all"
                            ? "Nenhum cliente encontrado com os filtros aplicados"
                            : "Nenhum cliente cadastrado"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalCustPages > 1 && (
                <Pagination current={custPage} total={totalCustPages} onChange={setCustPage} count={filteredCustomers.length} />
              )}
            </TabsContent>

            {/* Suppliers Table */}
            <TabsContent value="suppliers" className="mt-0">
              <div className="rounded-lg border border-border dark:border-brand/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 dark:bg-[#132925]/50">
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Documento</TableHead>
                      <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                      <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Criado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedSuppliers.map((s) => (
                      <TableRow key={s.id} className="hover:bg-brand/5">
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{s.document || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {s.category ? (
                            <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[s.category] || "text-muted-foreground"}`}>
                              {CATEGORY_LABELS[s.category] || s.category}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {s.city && s.state ? `${s.city}/${s.state}` : s.city || s.state || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-brand/20 text-brand font-normal">
                            {s.company_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                              <UserCheck className="h-3 w-3 mr-1" />Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <UserX className="h-3 w-3 mr-1" />Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pagedSuppliers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {search || companyFilter !== "all" || statusFilter !== "all"
                            ? "Nenhum fornecedor encontrado com os filtros aplicados"
                            : "Nenhum fornecedor cadastrado"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalSuppPages > 1 && (
                <Pagination current={suppPage} total={totalSuppPages} onChange={setSuppPage} count={filteredSuppliers.length} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple pagination component
function Pagination({ current, total, onChange, count }: {
  current: number;
  total: number;
  onChange: (page: number) => void;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-muted-foreground">
        {count} registro{count !== 1 ? "s" : ""} — Página {current + 1} de {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => onChange(current - 1)}
          className="border-brand/20"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={current >= total - 1}
          onClick={() => onChange(current + 1)}
          className="border-brand/20"
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
