'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { OFXTransaction, OFXParseResult } from '@/lib/ofxParser';
import { ZipParseResult } from '@/lib/zipEmailParser';
import type { TransactionRule } from '@/modules/finance/reconciliation/services/transactionRules';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  reconciled: boolean;
  reconciled_at: string | null;
  bank_account_id: string;
  bank_statement_ref: string | null;
}

interface BankStatement {
  id: string;
  fitid: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reconciled: boolean;
  reconciled_transaction_id: string | null;
  bank_account_id: string;
}

interface Match {
  transactionId: string;
  bankStatementId: string;
  confidence: 'exact' | 'high' | 'medium';
}

export interface ReconciliationStats {
  totalBank: number;
  totalSystem: number;
  totalReconciled: number;
  totalPending: number;
  difference: number;
  reconciledCount: number;
  pendingCount: number;
  bankCount: number;
}

export function useReconciliation(bankAccountId: string | null, period: { year: number; month: number }) {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [showOnlyPending, setShowOnlyPending] = useState(true);

  const startDate = format(new Date(period.year, period.month - 1, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(period.year, period.month, 0), 'yyyy-MM-dd');

  // Fetch system transactions
  const { data: systemTransactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['reconciliation-transactions', currentCompany?.id, bankAccountId, startDate, endDate],
    queryFn: async () => {
      if (!currentCompany?.id || !bankAccountId) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('id, transaction_date, description, amount, type, reconciled, reconciled_at, bank_account_id, bank_statement_ref')
        .eq('company_id', currentCompany.id)
        .eq('is_deleted', false)
        .eq('bank_account_id', bankAccountId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!currentCompany?.id && !!bankAccountId,
  });

  // Fetch bank statements
  const { data: bankStatements = [], isLoading: loadingStatements } = useQuery({
    queryKey: ['bank-statements', currentCompany?.id, bankAccountId, startDate, endDate],
    queryFn: async () => {
      if (!currentCompany?.id || !bankAccountId) return [];

      const { data, error } = await supabase
        .from('bank_statements')
        .select('id, fitid, transaction_date, description, amount, type, reconciled, reconciled_transaction_id, bank_account_id')
        .eq('company_id', currentCompany.id)
        .eq('bank_account_id', bankAccountId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as BankStatement[];
    },
    enabled: !!currentCompany?.id && !!bankAccountId,
  });

  // Fetch transaction rules
  const { data: rules = [] } = useQuery({
    queryKey: ['transaction-rules', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { transactionRulesService } = await import('@/modules/finance/reconciliation/services/transactionRules');
      return transactionRulesService.fetchRules(currentCompany.id);
    },
    enabled: !!currentCompany?.id,
  });

  // Calculate stats
  const stats = useMemo((): ReconciliationStats => {
    const totalBank = bankStatements.reduce((sum, s) => {
      return sum + (s.type === 'credit' ? s.amount : -s.amount);
    }, 0);

    const totalSystem = systemTransactions.reduce((sum, t) => {
      return sum + (t.type === 'entrada' ? t.amount : -t.amount);
    }, 0);

    const reconciledTxs = systemTransactions.filter(t => t.reconciled);
    const totalReconciled = reconciledTxs.reduce((sum, t) => {
      return sum + (t.type === 'entrada' ? t.amount : -t.amount);
    }, 0);

    const pendingTxs = systemTransactions.filter(t => !t.reconciled);
    const totalPending = pendingTxs.reduce((sum, t) => {
      return sum + (t.type === 'entrada' ? t.amount : -t.amount);
    }, 0);

    return {
      totalBank,
      totalSystem,
      totalReconciled,
      totalPending,
      difference: totalSystem - totalBank,
      reconciledCount: reconciledTxs.length,
      pendingCount: pendingTxs.length,
      bankCount: bankStatements.length,
    };
  }, [systemTransactions, bankStatements]);

  // Find suggested matches
  const suggestedMatches = useMemo((): Match[] => {
    const matches: Match[] = [];
    const usedBankIds = new Set<string>();

    // Only suggest for unreconciled items
    const pendingTxs = systemTransactions.filter(t => !t.reconciled);
    const pendingStatements = bankStatements.filter(s => !s.reconciled);

    for (const tx of pendingTxs) {
      const txAmount = tx.type === 'entrada' ? tx.amount : -tx.amount;
      const txDate = new Date(tx.transaction_date);

      for (const stmt of pendingStatements) {
        if (usedBankIds.has(stmt.id)) continue;

        const stmtAmount = stmt.type === 'credit' ? stmt.amount : -stmt.amount;
        const stmtDate = new Date(stmt.transaction_date);
        const daysDiff = Math.abs((txDate.getTime() - stmtDate.getTime()) / (1000 * 60 * 60 * 24));

        // Exact match: same amount and within 3 days
        if (txAmount === stmtAmount && daysDiff <= 3) {
          matches.push({
            transactionId: tx.id,
            bankStatementId: stmt.id,
            confidence: daysDiff === 0 ? 'exact' : 'high',
          });
          usedBankIds.add(stmt.id);
          break;
        }

        // Medium confidence: same amount but different date
        if (txAmount === stmtAmount && daysDiff <= 7) {
          matches.push({
            transactionId: tx.id,
            bankStatementId: stmt.id,
            confidence: 'medium',
          });
          usedBankIds.add(stmt.id);
          break;
        }
      }
    }

    return matches;
  }, [systemTransactions, bankStatements]);

  // Find rule matches for bank statements
  const ruleMatches = useMemo(() => {
    if (!rules.length) return new Map();

    const matchRule = (description: string) => {
      if (!description) return null;
      const normalizedDesc = description.toLowerCase();
      // Sort rules by specificity (exact match first, then starts_with, then contains)
      const sortedRules = [...rules].sort((a: TransactionRule, b: TransactionRule) => {
        const priority: Record<string, number> = { exact: 1, starts_with: 2, contains: 3 };
        return (priority[a.description_match_type] ?? 4) - (priority[b.description_match_type] ?? 4);
      });

      for (const rule of sortedRules) {
        const keyword = rule.keyword.toLowerCase();
        switch (rule.description_match_type) {
          case 'exact': if (normalizedDesc === keyword) return rule; break;
          case 'starts_with': if (normalizedDesc.startsWith(keyword)) return rule; break;
          case 'contains': default: if (normalizedDesc.includes(keyword)) return rule; break;
        }
      }
      return null;
    };

    const matches = new Map();
    for (const stmt of bankStatements) {
      if (stmt.reconciled) continue;
      // Use clean description which is already providing by the parser results/import
      const rule = matchRule(stmt.description);
      if (rule) {
        matches.set(stmt.id, rule);
      }
    }
    return matches;
  }, [bankStatements, rules]);

  // Import OFX mutation
  const importOFXMutation = useMutation({
    mutationFn: async ({ file, parseResult }: { file: File; parseResult: OFXParseResult }) => {
      if (!currentCompany?.id || !bankAccountId || !user?.id) {
        throw new Error('Dados de contexto não disponíveis');
      }

      if (!parseResult.success || parseResult.transactions.length === 0) {
        throw new Error(parseResult.errors.join(', ') || 'Nenhuma transação encontrada');
      }

      // Calculate totals for import record
      const totalCredits = parseResult.transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalDebits = parseResult.transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      // Create import record first
      const { data: importRecord, error: importError } = await supabase
        .from('bank_statement_imports')
        .insert({
          company_id: currentCompany.id,
          bank_account_id: bankAccountId,
          filename: file.name,
          period_start: parseResult.startDate ? format(parseResult.startDate, 'yyyy-MM-dd') : null,
          period_end: parseResult.endDate ? format(parseResult.endDate, 'yyyy-MM-dd') : null,
          total_transactions: parseResult.transactions.length,
          total_credits: totalCredits,
          total_debits: totalDebits,
          imported_by: user.id,
          detected_bank_name: parseResult.bankName || null,
        })
        .select()
        .single();

      if (importError) throw importError;

      // Prepare statements for insertion with import_id
      const statements = parseResult.transactions.map((tx: OFXTransaction) => ({
        company_id: currentCompany.id,
        bank_account_id: bankAccountId,
        fitid: tx.fitid,
        transaction_date: format(tx.date, 'yyyy-MM-dd'),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        memo: tx.memo || null,
        check_number: tx.checkNum || null,
        imported_by: user.id,
        source_file: file.name,
        import_id: importRecord.id,
      }));

      // Insert with upsert to handle duplicates
      const { data: inserted, error } = await supabase
        .from('bank_statements')
        .upsert(statements, {
          onConflict: 'bank_account_id,fitid',
          ignoreDuplicates: true
        })
        .select();

      if (error) throw error;

      const actualCount = inserted?.length ?? 0;
      const duplicateCount = statements.length - actualCount;

      return {
        imported: actualCount,
        duplicates: duplicateCount,
        total: statements.length,
        parseResult,
        importId: importRecord.id,
      };
    },
    onSuccess: (data) => {
      if (data.imported === 0 && data.duplicates > 0) {
        toast.warning(`Todas as ${data.duplicates} transações já foram importadas anteriormente`);
      } else if (data.duplicates > 0) {
        toast.success(`${data.imported} transações importadas (${data.duplicates} duplicatas ignoradas)`);
      } else {
        toast.success(`${data.imported} transações importadas com sucesso`);
      }
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  // Import ZIP (email-based bank statements)
  const importZIPMutation = useMutation({
    mutationFn: async ({ file, parseResult }: { file: File; parseResult: ZipParseResult }) => {
      if (!currentCompany?.id || !bankAccountId || !user?.id) {
        throw new Error('Dados de contexto não disponíveis');
      }

      if (!parseResult.success || parseResult.allTransactions.length === 0) {
        throw new Error(parseResult.errors.join(', ') || 'Nenhuma transação encontrada nos emails');
      }

      const totalCredits = parseResult.allTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalDebits = parseResult.allTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const bankName = parseResult.statements[0]?.bankName || 'Email';
      const allDates = parseResult.allTransactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
      const periodStart = allDates[0];
      const periodEnd = allDates[allDates.length - 1];

      // Create import record
      const { data: importRecord, error: importError } = await supabase
        .from('bank_statement_imports')
        .insert({
          company_id: currentCompany.id,
          bank_account_id: bankAccountId,
          filename: file.name,
          period_start: periodStart ? format(periodStart, 'yyyy-MM-dd') : null,
          period_end: periodEnd ? format(periodEnd, 'yyyy-MM-dd') : null,
          total_transactions: parseResult.allTransactions.length,
          total_credits: totalCredits,
          total_debits: totalDebits,
          imported_by: user.id,
          detected_bank_name: bankName,
        })
        .select()
        .single();

      if (importError) throw importError;

      // Generate deterministic FITIDs for email transactions
      const statements = parseResult.allTransactions.map((tx, index) => {
        const dateStr = format(tx.date, 'yyyyMMdd');
        const amountStr = Math.abs(tx.amount).toFixed(2).replace('.', '');
        const fitid = `EMAIL-${dateStr}-${amountStr}-${index}`;

        return {
          company_id: currentCompany.id,
          bank_account_id: bankAccountId,
          fitid,
          transaction_date: format(tx.date, 'yyyy-MM-dd'),
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          memo: tx.category || null,
          imported_by: user.id,
          source_file: file.name,
          import_id: importRecord.id,
        };
      });

      const { data: inserted, error } = await supabase
        .from('bank_statements')
        .upsert(statements, {
          onConflict: 'bank_account_id,fitid',
          ignoreDuplicates: true,
        })
        .select();

      if (error) throw error;

      const actualCount = inserted?.length ?? 0;
      const duplicateCount = statements.length - actualCount;

      return {
        imported: actualCount,
        duplicates: duplicateCount,
        total: statements.length,
        importId: importRecord.id,
      };
    },
    onSuccess: (data) => {
      if (data.imported === 0 && data.duplicates > 0) {
        toast.warning(`Todas as ${data.duplicates} transações já foram importadas anteriormente`);
      } else if (data.duplicates > 0) {
        toast.success(`${data.imported} transações importadas dos emails (${data.duplicates} duplicatas ignoradas)`);
      } else {
        toast.success(`${data.imported} transações importadas dos emails`);
      }
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar emails: ${error.message}`);
    },
  });

  // Reconcile transactions mutation
  const reconcileMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user.id,
        })
        .in('id', transactionIds)
        .eq('company_id', currentCompany!.id);

      if (error) throw error;
      return transactionIds.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} transações conciliadas`);
      setSelectedTransactionIds([]);
      queryClient.invalidateQueries({ queryKey: ['reconciliation-transactions'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao conciliar: ${error.message}`);
    },
  });

  // Reconcile a pair (transaction + bank statement)
  const reconcilePairMutation = useMutation({
    mutationFn: async ({ transactionId, bankStatementId }: { transactionId: string; bankStatementId: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Update transaction
      const { error: txError } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user.id,
          bank_statement_ref: bankStatementId,
        })
        .eq('id', transactionId)
        .eq('company_id', currentCompany!.id);

      if (txError) throw txError;

      // Update bank statement
      const { error: stmtError } = await supabase
        .from('bank_statements')
        .update({
          reconciled: true,
          reconciled_transaction_id: transactionId,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user.id,
        })
        .eq('id', bankStatementId)
        .eq('company_id', currentCompany!.id);

      if (stmtError) throw stmtError;
    },
    onSuccess: () => {
      toast.success('Par conciliado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['reconciliation-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao conciliar par: ${error.message}`);
    },
  });

  // Unreconcile mutation
  const unreconcileMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const tx = systemTransactions.find(t => t.id === transactionId);

      // Update transaction
      const { error: txError } = await supabase
        .from('transactions')
        .update({
          reconciled: false,
          reconciled_at: null,
          reconciled_by: null,
          bank_statement_ref: null,
        })
        .eq('id', transactionId)
        .eq('company_id', currentCompany!.id);

      if (txError) throw txError;

      // If linked to bank statement, unreconcile it too
      if (tx?.bank_statement_ref) {
        const { error: stmtError } = await supabase
          .from('bank_statements')
          .update({
            reconciled: false,
            reconciled_transaction_id: null,
            reconciled_at: null,
            reconciled_by: null,
          })
          .eq('id', tx.bank_statement_ref)
          .eq('company_id', currentCompany!.id);

        if (stmtError) throw stmtError;
      }
    },
    onSuccess: () => {
      toast.success('Conciliação desfeita');
      queryClient.invalidateQueries({ queryKey: ['reconciliation-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desfazer: ${error.message}`);
    },
  });

  // Auto reconcile all exact matches
  const autoReconcile = useCallback(async () => {
    const exactMatches = suggestedMatches.filter(m => m.confidence === 'exact' || m.confidence === 'high');

    if (exactMatches.length === 0) {
      toast.info('Nenhuma correspondência exata encontrada');
      return 0;
    }

    let count = 0;
    for (const match of exactMatches) {
      try {
        await reconcilePairMutation.mutateAsync({
          transactionId: match.transactionId,
          bankStatementId: match.bankStatementId,
        });
        count++;
      } catch {
        // Continue with next match
      }
    }

    return count;
  }, [suggestedMatches, reconcilePairMutation]);

  // Filter displayed transactions
  const filteredTransactions = useMemo(() => {
    if (showOnlyPending) {
      return systemTransactions.filter(t => !t.reconciled);
    }
    return systemTransactions;
  }, [systemTransactions, showOnlyPending]);

  const filteredStatements = useMemo(() => {
    if (showOnlyPending) {
      return bankStatements.filter(s => !s.reconciled);
    }
    return bankStatements;
  }, [bankStatements, showOnlyPending]);

  return {
    // Data
    systemTransactions: filteredTransactions,
    bankStatements: filteredStatements,
    allTransactions: systemTransactions,
    allStatements: bankStatements,
    stats,
    suggestedMatches,

    // Selection
    selectedTransactionIds,
    setSelectedTransactionIds,

    // Filters
    showOnlyPending,
    setShowOnlyPending,

    // Loading states
    isLoading: loadingTransactions || loadingStatements,
    isImporting: importOFXMutation.isPending,
    isImportingZip: importZIPMutation.isPending,
    isReconciling: reconcileMutation.isPending || reconcilePairMutation.isPending,

    // Actions
    importOFX: (file: File, parseResult: OFXParseResult) => importOFXMutation.mutateAsync({ file, parseResult }),
    importZIP: (file: File, parseResult: ZipParseResult) => importZIPMutation.mutateAsync({ file, parseResult }),
    reconcileSelected: () => reconcileMutation.mutateAsync(selectedTransactionIds),
    reconcilePair: (txId: string, bankId: string) =>
      reconcilePairMutation.mutateAsync({ transactionId: txId, bankStatementId: bankId }),
    unreconcile: (txId: string) => unreconcileMutation.mutateAsync(txId),
    autoReconcile,
    ruleMatches, // Expose rule matches
  };
}
