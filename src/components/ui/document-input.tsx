'use client';

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  showTypeSelector?: boolean;
  defaultType?: "cpf" | "cnpj";
  disabled?: boolean;
}

// CPF mask: 000.000.000-00
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
}

// CNPJ mask: 00.000.000/0000-00
function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2");
}

// Validate CPF
function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
}

// Validate CNPJ
function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(digits[13]);
}

function detectDocumentType(value: string): "cpf" | "cnpj" | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return "cpf";
  if (digits.length <= 14) return "cnpj";
  return null;
}

export function DocumentInput({
  value,
  onChange,
  id = "document",
  className,
  showTypeSelector = true,
  defaultType = "cpf",
  disabled = false,
}: DocumentInputProps) {
  const [docType, setDocType] = useState<"cpf" | "cnpj">(defaultType);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const detected = detectDocumentType(value);
    if (detected && value.replace(/\D/g, "").length > 0) {
      setDocType(detected);
    }
  }, []);

  useEffect(() => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) {
      setIsValid(null);
    } else if (docType === "cpf" && digits.length === 11) {
      setIsValid(validateCPF(digits));
    } else if (docType === "cnpj" && digits.length === 14) {
      setIsValid(validateCNPJ(digits));
    } else {
      setIsValid(null);
    }
  }, [value, docType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = docType === "cpf" ? formatCPF(raw) : formatCNPJ(raw);
    onChange(formatted);
  };

  const handleTypeChange = (type: string) => {
    setDocType(type as "cpf" | "cnpj");
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showTypeSelector && (
        <Tabs value={docType} onValueChange={handleTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="cpf" className="text-xs" disabled={disabled}>
              CPF (Pessoa Física)
            </TabsTrigger>
            <TabsTrigger value="cnpj" className="text-xs" disabled={disabled}>
              CNPJ (Pessoa Jurídica)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
          className={cn(
            "pr-10",
            isValid === true && "border-success focus-visible:ring-success",
            isValid === false && "border-destructive focus-visible:ring-destructive"
          )}
          disabled={disabled}
        />
        {isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
      {isValid === false && (
        <p className="text-xs text-destructive">
          {docType === "cpf" ? "CPF inválido" : "CNPJ inválido"}
        </p>
      )}
    </div>
  );
}
