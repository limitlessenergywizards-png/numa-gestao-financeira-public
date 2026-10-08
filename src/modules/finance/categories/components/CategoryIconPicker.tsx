'use client';

import { cn } from "@/lib/utils";
import {
  Tag,
  ShoppingCart,
  Briefcase,
  Car,
  Home,
  Utensils,
  Heart,
  Zap,
  Smartphone,
  Gift,
  Plane,
  GraduationCap,
  Music,
  Film,
  Dumbbell,
  Coffee,
  Wallet,
  CreditCard,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "tag", icon: Tag, label: "Tag" },
  { name: "shopping-cart", icon: ShoppingCart, label: "Compras" },
  { name: "briefcase", icon: Briefcase, label: "Trabalho" },
  { name: "car", icon: Car, label: "Transporte" },
  { name: "home", icon: Home, label: "Casa" },
  { name: "utensils", icon: Utensils, label: "Alimentação" },
  { name: "heart", icon: Heart, label: "Saúde" },
  { name: "zap", icon: Zap, label: "Energia" },
  { name: "smartphone", icon: Smartphone, label: "Tecnologia" },
  { name: "gift", icon: Gift, label: "Presentes" },
  { name: "plane", icon: Plane, label: "Viagem" },
  { name: "graduation-cap", icon: GraduationCap, label: "Educação" },
  { name: "music", icon: Music, label: "Música" },
  { name: "film", icon: Film, label: "Entretenimento" },
  { name: "dumbbell", icon: Dumbbell, label: "Fitness" },
  { name: "coffee", icon: Coffee, label: "Café" },
  { name: "wallet", icon: Wallet, label: "Carteira" },
  { name: "credit-card", icon: CreditCard, label: "Cartão" },
  { name: "trending-up", icon: TrendingUp, label: "Investimentos" },
];

interface CategoryIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function CategoryIconPicker({ value, onChange, color = "#6366f1" }: CategoryIconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICONS.map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-[transform,box-shadow] hover:scale-110",
            value === name
              ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
              : "border-border hover:border-muted-foreground"
          )}
          title={label}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: value === name ? color : undefined }}
          />
        </button>
      ))}
    </div>
  );
}

export { ICONS };
