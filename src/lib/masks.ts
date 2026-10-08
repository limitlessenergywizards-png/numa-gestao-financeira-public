/**
 * Input mask utilities for Brazilian formats
 */

// CNPJ mask: XX.XXX.XXX/XXXX-XX
export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

// CPF mask: XXX.XXX.XXX-XX
export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2')
    .slice(0, 14);
}

// CEP mask: XXXXX-XXX
export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

// Phone mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

// Currency mask: R$ X.XXX,XX
export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');
  const number = parseInt(digits || '0', 10) / 100;
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Parse BR currency string "1.500,00" or "R$ 1.500,00" to number 1500.00
// ⚠️ AUDIT FIX: Now routes through Decimal.js for precision-safe parsing.
// Old implementation used parseFloat which causes IEEE 754 floating-point drift.
export { parseCurrencyValueSafe as parseCurrencyValue } from '@/lib/money';

// Format value for input (without R$ prefix): "1.500,00"
export function maskCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const number = parseInt(digits || '0', 10) / 100;
  return number.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Remove all masks
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

// Validate CNPJ checksum
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

// Validate CEP format
export function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Format CNPJ with mask
export function formatCnpj(cnpj: string): string {
  return maskCNPJ(cnpj);
}

// Alias for isValidCNPJ for consistency
export const validateCnpj = isValidCNPJ;
