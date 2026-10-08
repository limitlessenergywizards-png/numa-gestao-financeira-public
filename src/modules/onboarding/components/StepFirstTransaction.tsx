'use client';

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Check
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
}

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
}

interface TransactionData {
  type: "entrada" | "saida";
  amount: string;
  description: string;
  category_name: string;
  bank_account_name: string;
  date: string;
}

interface StepFirstTransactionProps {
  bankAccounts: BankAccount[];
  categories: Category[];
  transaction: TransactionData;
  onChange: (data: TransactionData) => void;
}

export const StepFirstTransaction = memo(function StepFirstTransaction({
  bankAccounts,
  categories,
  transaction,
  onChange
}: StepFirstTransactionProps) {
  const [hasSelected, setHasSelected] = useState(false);

  const validAccounts = bankAccounts.filter((a) => a.name.trim().length > 0);
  const hasInvalidAccounts = bankAccounts.length > validAccounts.length;

  const filteredCategories = categories.filter((c) =>
    transaction.type === "entrada" ? c.type === "receita" : c.type === "despesa"
  );

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = (parseInt(numbers || "0", 10) / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    onChange({ ...transaction, amount: formatted });
  };

  const selectType = (type: "entrada" | "saida") => {
    onChange({
      ...transaction,
      type,
      category_name: "" // Reset category when type changes
    });
    setHasSelected(true);
  };

  const isValid = () => {
    const amount = parseFloat(transaction.amount.replace(/\./g, "").replace(",", "."));
    return (
      amount > 0 &&
      transaction.description.trim().length > 0 &&
      transaction.category_name.length > 0 &&
      transaction.bank_account_name.length > 0
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Seu Primeiro Lançamento</h2>
        <p className="text-sm text-muted-foreground">
          Registre uma movimentação recente para começar
        </p>
      </div>

      {/* Type Selection */}
      {!hasSelected ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => selectType("entrada")}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-success/30 bg-success/5 hover:bg-success/10 hover:border-success transition-colors"
          >
            <ArrowUpCircle className="w-10 h-10 text-success" />
            <span className="font-medium text-success">💰 Recebi</span>
            <span className="text-xs text-muted-foreground">Venda, pagamento, etc.</span>
          </button>

          <button
            type="button"
            onClick={() => selectType("saida")}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 hover:border-destructive transition-colors"
          >
            <ArrowDownCircle className="w-10 h-10 text-destructive" />
            <span className="font-medium text-destructive">💸 Paguei</span>
            <span className="text-xs text-muted-foreground">Conta, compra, etc.</span>
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Type indicator */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            transaction.type === "entrada"
              ? "bg-success/10 border border-success/20"
              : "bg-destructive/10 border border-destructive/20"
          )}>
            <div className="flex items-center gap-2">
              {transaction.type === "entrada" ? (
                <ArrowUpCircle className="w-5 h-5 text-success" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-medium">
                {transaction.type === "entrada" ? "Receita" : "Despesa"}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setHasSelected(false)}
            >
              Trocar
            </Button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                value={transaction.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00"
                className="pl-10 text-lg font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={transaction.description}
              onChange={(e) => onChange({ ...transaction, description: e.target.value })}
              placeholder="Ex: Pagamento cliente, Conta de luz..."
            />
          </div>

          {/* Category & Account */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={transaction.category_name}
                onValueChange={(value) => onChange({ ...transaction, category_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conta *</Label>
              <Select
                value={transaction.bank_account_name}
                onValueChange={(value) => onChange({ ...transaction, bank_account_name: value })}
                disabled={validAccounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={validAccounts.length === 0 ? "Nenhuma conta válida" : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {validAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.name}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validAccounts.length === 0 && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {hasInvalidAccounts
                    ? "Existe(m) conta(s) sem nome. Volte para corrigir."
                    : "Nenhuma conta cadastrada."}
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data
            </Label>
            <Input
              type="date"
              value={transaction.date}
              onChange={(e) => onChange({ ...transaction, date: e.target.value })}
            />
          </div>

          {/* Validation indicator */}
          {isValid() && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
              <Check className="w-4 h-4" />
              <span>Lançamento pronto para ser salvo!</span>
            </div>
          )}
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        💡 Dica: Você pode pular esta etapa e registrar depois
      </p>
    </motion.div>
  );
});

StepFirstTransaction.displayName = "StepFirstTransaction";