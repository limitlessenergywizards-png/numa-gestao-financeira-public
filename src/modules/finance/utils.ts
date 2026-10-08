
import { moneySub, moneyToNumber } from '@/lib/money';

export const getAccountRemaining = <T extends { total_amount: number; paid_amount: number }>(
    account: T
): number => {
    return moneyToNumber(moneySub(account.total_amount, account.paid_amount));
};
