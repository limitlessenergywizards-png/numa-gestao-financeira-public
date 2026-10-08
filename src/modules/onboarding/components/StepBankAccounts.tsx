'use client';

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Landmark,
  Plus,
  Trash2,
  Check,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  initial_balance: string;
}

interface StepBankAccountsProps {
  accounts: BankAccount[];
  onChange: (accounts: BankAccount[]) => void;
}

const POPULAR_BANKS = [
  { value: "nubank", label: "Nubank" },
  { value: "inter", label: "Banco Inter" },
  { value: "itau", label: "Itaú" },
  { value: "bradesco", label: "Bradesco" },
  { value: "bb", label: "Banco do Brasil" },
  { value: "santander", label: "Santander" },
  { value: "caixa", label: "Caixa Econômica" },
  { value: "c6", label: "C6 Bank" },
  { value: "sicoob", label: "Sicoob" },
  { value: "sicredi", label: "Sicredi" },
  { value: "outro", label: "Outro" },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const StepBankAccounts = memo(function StepBankAccounts({
  accounts,
  onChange
}: StepBankAccountsProps) {
  const [showError, setShowError] = useState(false);

  const addAccount = () => {
    const newAccount: BankAccount = {
      id: generateId(),
      name: "",
      bank_name: "",
      initial_balance: "0,00",
    };
    onChange([...accounts, newAccount]);
  };

  const removeAccount = (id: string) => {
    onChange(accounts.filter((a) => a.id !== id));
  };

  const updateAccount = (id: string, field: keyof BankAccount, value: string) => {
    onChange(
      accounts.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
    setShowError(false);
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = (parseInt(numbers || "0", 10) / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleBalanceChange = (id: string, value: string) => {
    const formatted = formatCurrency(value);
    updateAccount(id, "initial_balance", formatted);
  };

  const isValidAccount = (account: BankAccount) => {
    return account.name.trim().length > 0 && account.bank_name.length > 0;
  };

  const hasValidAccounts = accounts.length > 0 && accounts.some(isValidAccount);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
          <Landmark className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Suas Contas Bancárias</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre suas contas para controlar o saldo
        </p>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {accounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl border-2 bg-card/50 space-y-4 relative",
              isValidAccount(account) ? "border-success/30" : "border-border"
            )}
          >
            {isValidAccount(account) && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Conta {index + 1}
              </span>
              {accounts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAccount(account.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="Remover conta"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select
                  value={account.bank_name}
                  onValueChange={(value) => updateAccount(account.id, "bank_name", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BANKS.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome da Conta *</Label>
                <Input
                  value={account.name}
                  onChange={(e) => updateAccount(account.id, "name", e.target.value)}
                  placeholder="Ex: Conta Principal"
                />
              </div>

              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    value={account.initial_balance}
                    onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                    placeholder="0,00"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Account Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addAccount}
          className="w-full gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Adicionar Conta Bancária
        </Button>
      </div>

      {/* Validation Message */}
      {!hasValidAccounts && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Adicione pelo menos uma conta bancária</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        💡 Dica: Você pode pular esta etapa e configurar depois
      </p>
    </motion.div>
  );
});

StepBankAccounts.displayName = "StepBankAccounts";