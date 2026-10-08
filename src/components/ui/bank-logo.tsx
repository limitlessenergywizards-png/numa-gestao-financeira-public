import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface BankLogoProps {
  bankName: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Bank configurations with colors
const bankConfigs: Record<string, { abbrev: string; bg: string; text: string }> = {
  "banco do brasil": { abbrev: "BB", bg: "bg-yellow-400", text: "text-blue-900" },
  "bb": { abbrev: "BB", bg: "bg-yellow-400", text: "text-blue-900" },
  "itau": { abbrev: "Itaú", bg: "bg-orange-500", text: "text-white" },
  "itaú": { abbrev: "Itaú", bg: "bg-orange-500", text: "text-white" },
  "bradesco": { abbrev: "Bra", bg: "bg-red-600", text: "text-white" },
  "santander": { abbrev: "San", bg: "bg-red-700", text: "text-white" },
  "caixa": { abbrev: "CEF", bg: "bg-blue-600", text: "text-white" },
  "caixa economica": { abbrev: "CEF", bg: "bg-blue-600", text: "text-white" },
  "nubank": { abbrev: "Nu", bg: "bg-purple-600", text: "text-white" },
  "inter": { abbrev: "Inter", bg: "bg-orange-600", text: "text-white" },
  "banco inter": { abbrev: "Inter", bg: "bg-orange-600", text: "text-white" },
  "btg": { abbrev: "BTG", bg: "bg-blue-900", text: "text-white" },
  "btg pactual": { abbrev: "BTG", bg: "bg-blue-900", text: "text-white" },
  "c6": { abbrev: "C6", bg: "bg-gray-900", text: "text-white" },
  "c6 bank": { abbrev: "C6", bg: "bg-gray-900", text: "text-white" },
  "sicoob": { abbrev: "Sic", bg: "bg-green-600", text: "text-white" },
  "sicredi": { abbrev: "Sicr", bg: "bg-green-700", text: "text-white" },
  "safra": { abbrev: "Safra", bg: "bg-blue-800", text: "text-yellow-400" },
  "original": { abbrev: "Orig", bg: "bg-green-500", text: "text-white" },
  "banco original": { abbrev: "Orig", bg: "bg-green-500", text: "text-white" },
  "neon": { abbrev: "Neon", bg: "bg-cyan-400", text: "text-gray-900" },
  "picpay": { abbrev: "Pic", bg: "bg-green-400", text: "text-gray-900" },
  "mercado pago": { abbrev: "MP", bg: "bg-sky-400", text: "text-gray-900" },
  "pagseguro": { abbrev: "Pag", bg: "bg-yellow-500", text: "text-gray-900" },
  "stone": { abbrev: "Sto", bg: "bg-green-600", text: "text-white" },
  "xp": { abbrev: "XP", bg: "bg-gray-800", text: "text-white" },
  "xp investimentos": { abbrev: "XP", bg: "bg-gray-800", text: "text-white" },
  "modal": { abbrev: "Mod", bg: "bg-indigo-600", text: "text-white" },
  "banco modal": { abbrev: "Mod", bg: "bg-indigo-600", text: "text-white" },
  "next": { abbrev: "Next", bg: "bg-green-500", text: "text-white" },
  "ame": { abbrev: "Ame", bg: "bg-pink-500", text: "text-white" },
  "will": { abbrev: "Will", bg: "bg-purple-500", text: "text-white" },
  "will bank": { abbrev: "Will", bg: "bg-purple-500", text: "text-white" },
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function BankLogo({ bankName, size = "md", className }: BankLogoProps) {
  const normalizedName = (bankName || "").toLowerCase().trim();
  const config = bankConfigs[normalizedName];

  if (!config) {
    return (
      <div className={cn(
        "rounded-lg flex items-center justify-center bg-muted",
        sizeClasses[size],
        className
      )}>
        <Building2 className="h-1/2 w-1/2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg flex items-center justify-center font-bold",
      sizeClasses[size],
      config.bg,
      config.text,
      className
    )}>
      {config.abbrev}
    </div>
  );
}
