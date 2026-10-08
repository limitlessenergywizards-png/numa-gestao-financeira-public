import { memo } from "react";
import { GlassCard } from "./GlassCard";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassProfilePanelProps {
  userName?: string;
  userCompany?: string;
  planName?: string;
  avatarUrl?: string;
  className?: string;
}

const quickActions = [
  { icon: ArrowUpRight, label: "Transferir", color: "text-gold-400" },
  { icon: ArrowDownLeft, label: "Receber", color: "text-emerald-400" },
  { icon: Receipt, label: "Boleto", color: "text-sky-400" },
  { icon: Plus, label: "Novo", color: "text-violet-400" },
];

export const GlassProfilePanel = memo(function GlassProfilePanel({
  userName = "Usuário",
  userCompany = "Minha Empresa",
  planName = "Premium",
  avatarUrl,
  className,
}: GlassProfilePanelProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Profile Card */}
      <GlassCard variant="warm" padding="md" className="text-center">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gold-500/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center ring-2 ring-gold-500/50">
                <span className="text-2xl font-bold text-numa-deep">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Plan badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gold-500 text-numa-deep text-[10px] font-bold whitespace-nowrap">
              {planName}
            </div>
          </div>

          <h4 className="font-semibold text-foreground">{userName}</h4>
          <p className="text-sm text-muted-foreground">{userCompany}</p>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 dark:bg-glass-elevated/50 hover:bg-muted dark:hover:bg-glass-highlight/50 transition-colors group"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-background dark:bg-glass-surface flex items-center justify-center border border-border/50 dark:border-glass-border",
                "group-hover:scale-105 transition-transform"
              )}
            >
              <action.icon className={cn("w-5 h-5", action.color)} />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
