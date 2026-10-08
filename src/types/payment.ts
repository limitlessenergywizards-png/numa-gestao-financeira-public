export interface PaymentPlan {
    id: string;
    name: string;
    price: number;
    interval: "month" | "year" | "quarter" | "semester";
    stripePriceId: string;
    hotmartCheckoutUrl: string;
}

export type PaymentMethod = "stripe" | "hotmart-card" | "hotmart-pix" | "hotmart-boleto";

export interface PaymentMethodOption {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: any; // Using any to avoid Lucide dependency issues in types file, or could import LucideIcon
    colorClass: string;
    badge?: string;
    badgeColorClass?: string;
}
