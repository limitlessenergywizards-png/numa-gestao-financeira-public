'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface ReconciliationHeaderProps {
  selectedBankId: string | null;
  onBankChange: (bankId: string) => void;
  selectedPeriod: { year: number; month: number };
  onPeriodChange: (period: { year: number; month: number }) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ReconciliationHeader({
  selectedBankId,
  onBankChange,
  selectedPeriod,
  onPeriodChange,
  searchQuery,
  onSearchChange,
}: ReconciliationHeaderProps) {
  const { currentCompany } = useCompany();

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  // Auto-select first bank if none selected
  useEffect(() => {
    if (!selectedBankId && bankAccounts.length > 0) {
      onBankChange(bankAccounts[0].id);
    }
  }, [bankAccounts, selectedBankId, onBankChange]);

  // Generate period options (current year + 1 year back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];

  const periodOptions = years.flatMap(year =>
    MONTHS.map((month, index) => ({
      value: `${year}-${index + 1}`,
      label: `${month} ${year}`,
      year,
      month: index + 1,
    }))
  );

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-[auto_auto_1fr] items-end gap-x-3 gap-y-4">
        {/* Bank Account */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Conta Bancária</Label>
          <Select value={selectedBankId || ''} onValueChange={onBankChange}>
            <SelectTrigger className="w-full sm:w-[260px] h-9">
              <SelectValue placeholder="Selecionar conta bancária" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.bank_name ? `${bank.bank_name} - ${bank.name}` : bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Período</Label>
          <Select
            value={`${selectedPeriod.year}-${selectedPeriod.month}`}
            onValueChange={(value) => {
              const [year, month] = value.split('-').map(Number);
              onPeriodChange({ year, month });
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-9">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Descrição..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
