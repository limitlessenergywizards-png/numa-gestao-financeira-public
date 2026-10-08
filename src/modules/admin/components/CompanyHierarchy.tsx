'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronRight, ChevronDown, Users, TrendingUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AdminCompany } from "@/modules/admin/hooks/useAdminData";

interface CompanyHierarchyProps {
  companies: AdminCompany[];
  onEdit?: (company: AdminCompany) => void;
  onDelete?: (company: AdminCompany) => void;
  onRefresh?: () => void;
}

interface CompanyNodeProps {
  company: AdminCompany;
  children: AdminCompany[];
  allCompanies: AdminCompany[];
  level: number;
  onEdit?: (company: AdminCompany) => void;
  onDelete?: (company: AdminCompany) => void;
}

function CompanyNode({ company, children, allCompanies, level, onEdit, onDelete }: CompanyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children.length > 0;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.05 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg transition-colors",
          "hover:bg-accent/50 group",
          level > 0 && "ml-6 border-l-2 border-dashed border-border"
        )}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Expandir/recolher"
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

        <div className={cn(
          "p-2 rounded-lg shrink-0",
          company.is_headquarters ? "bg-primary/10" : "bg-muted"
        )}>
          <Building2 className={cn(
            "h-5 w-5",
            company.is_headquarters ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{company.name}</p>
            {company.is_headquarters && (
              <Badge variant="default" className="text-xs shrink-0">Matriz</Badge>
            )}
          </div>
          {company.trading_name && (
            <p className="text-sm text-muted-foreground truncate">{company.trading_name}</p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{company.user_count}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Opções"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(company)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(company)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children.map((child) => {
              const childChildren = allCompanies.filter(
                (c) => c.parent_company_id === child.id
              );
              return (
                <CompanyNode
                  key={child.id}
                  company={child}
                  children={childChildren}
                  allCompanies={allCompanies}
                  level={level + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CompanyHierarchy({ companies, onEdit, onDelete, onRefresh }: CompanyHierarchyProps) {
  // Find root companies (headquarters or those without parent)
  const rootCompanies = companies.filter(
    (c) => c.is_headquarters || !c.parent_company_id
  );

  // Calculate totals
  const totalUsers = companies.reduce((acc, c) => acc + (c.user_count || 0), 0);
  const totalHeadquarters = companies.filter((c) => c.is_headquarters).length;
  const totalBranches = companies.filter((c) => !c.is_headquarters).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalHeadquarters}</p>
                  <p className="text-sm text-muted-foreground">Matriz(es)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-chart-2/10">
                  <Building2 className="h-6 w-6 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalBranches}</p>
                  <p className="text-sm text-muted-foreground">Filial(ais)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-chart-3/10">
                  <Users className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Usuários Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hierarchy Tree */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Estrutura Organizacional
            </CardTitle>
            <CardDescription>
              Hierarquia de matriz e filiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rootCompanies.length > 0 ? (
              <div className="space-y-2">
                {rootCompanies.map((company) => {
                  const children = companies.filter(
                    (c) => c.parent_company_id === company.id
                  );
                  return (
                    <CompanyNode
                      key={company.id}
                      company={company}
                      children={children}
                      allCompanies={companies}
                      level={0}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma empresa cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
