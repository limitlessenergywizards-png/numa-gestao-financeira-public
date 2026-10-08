import { Banknote, Zap, CreditCard, Receipt, Wallet } from 'lucide-react';

export const paymentMethodLabels: Record<string, { label: string; icon: typeof Banknote }> = {
  dinheiro: { label: 'Dinheiro', icon: Banknote },
  pix: { label: 'PIX', icon: Zap },
  cartao_debito: { label: 'Débito', icon: CreditCard },
  cartao_credito: { label: 'Crédito', icon: CreditCard },
  boleto: { label: 'Boleto', icon: Receipt },
  transferencia: { label: 'Transf.', icon: Wallet },
};

export const quickFilterLabels = {
  today: 'Hoje',
  week: 'Esta Semana',
  month: 'Este Mês',
};
