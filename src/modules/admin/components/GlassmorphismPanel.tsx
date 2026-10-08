'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, TrendingUp, Calendar, ExternalLink, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface CompanyDetails {
  id: string;
  name: string;
  tradingName?: string;
  type: 'headquarters' | 'branch';
  userCount: number;
  monthlyVolume: number;
  createdAt: string;
  parentName?: string;
  childrenCount: number;
}

interface GlassmorphismPanelProps {
  company: CompanyDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
}

export const GlassmorphismPanel: React.FC<GlassmorphismPanelProps> = ({
  company,
  isOpen,
  onClose,
  onViewDetails,
  onEdit
}) => {
  const { t } = useLanguage();

  const format$ = (value: number) => formatCurrency(value, { decimals: 0 });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && company && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute right-4 top-4 bottom-4 w-80 z-50"
        >
          {/* Premium Glassmorphism container */}
          <div className="h-full rounded-2xl overflow-hidden relative">
            {/* Background blur layer - Admin darker */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#132925]/95 via-[#17322C]/90 to-[#1B3B34]/85"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            />
            
            {/* Gold gradient border effect */}
            <div className="absolute inset-0 rounded-2xl border border-brand/30" />
            
            {/* Gold inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand/10 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    company.type === 'headquarters' 
                      ? 'bg-brand/20 text-brand' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground truncate max-w-[180px]">
                      {company.name}
                    </h3>
                    <Badge 
                      className={company.type === 'headquarters' 
                        ? 'bg-brand/10 text-brand border-brand/30 mt-1' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mt-1'
                      }
                    >
                      {company.type === 'headquarters' ? 'Matriz' : 'Filial'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-brand/10 text-muted-foreground hover:text-brand"
                  aria-label="Fechar painel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-xl bg-brand/5 border border-brand/20"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4 text-brand/60" />
                    <span className="text-xs">Usuários</span>
                  </div>
                  <p className="text-xl font-bold text-brand">{company.userCount}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500/60" />
                    <span className="text-xs">Volume/Mês</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">
                    {format$(company.monthlyVolume)}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4 text-cyan-500/60" />
                    <span className="text-xs">Criação</span>
                  </div>
                  <p className="text-sm font-medium text-cyan-400">
                    {formatDate(company.createdAt)}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4 text-blue-500/60" />
                    <span className="text-xs">Filiais</span>
                  </div>
                  <p className="text-xl font-bold text-blue-400">{company.childrenCount}</p>
                </motion.div>
              </div>

              {/* Connections section */}
              {company.parentName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Empresa Matriz
                  </h4>
                  <div className="p-3 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-brand" />
                      <span className="text-sm text-foreground">{company.parentName}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-brand/60" />
                  </div>
                </motion.div>
              )}

              {/* Trading name if exists */}
              {company.tradingName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Nome Fantasia
                  </h4>
                  <p className="text-sm text-foreground bg-brand/5 p-3 rounded-xl border border-brand/20">
                    {company.tradingName}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="mt-auto space-y-2">
                <Button
                  className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={() => onViewDetails(company.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Detalhes
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-brand/5 border-brand/30 hover:bg-brand/10 hover:border-brand/50 text-foreground"
                  onClick={() => onEdit(company.id)}
                >
                  <Edit className="h-4 w-4" />
                  Editar Empresa
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
