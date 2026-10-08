'use client';

import { memo, useState } from "react";
import { AmbientBackground } from "./AmbientBackground";
import { MobileHeader } from "./MobileHeader";
import { MobileBalanceHero } from "./MobileBalanceHero";
import { MobileQuickActions } from "./MobileQuickActions";
import { MobileMiniChart } from "./MobileMiniChart";
import { MobileTransactions } from "./MobileTransactions";
import { MobileGoals } from "./MobileGoals";
import { MobileBottomNav } from "./MobileBottomNav";
import { type PeriodType } from "@/lib/periodUtils";

interface TransactionDisplay {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  time: string;
}

interface MobileDashboardProps {
  userName?: string;
  userCompany?: string;
  avatarUrl?: string;
  totalBalance?: number;
  balanceChange?: { value: number; type: "increase" | "decrease" };
  receitas?: number;
  despesas?: number;
  currencySymbol?: string;
  notificationCount?: number;
  selectedPeriod?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  transactions?: TransactionDisplay[];
  onNavigate?: (route: string) => void;
}

export const MobileDashboard = memo(function MobileDashboard({
  userName = "Usuário",
  avatarUrl,
  totalBalance = 84300.23,
  balanceChange = { value: 42, type: "increase" },
  receitas = 12500,
  despesas = 8200,
  currencySymbol = "R$",
  notificationCount = 3,
  selectedPeriod = "month",
  onPeriodChange,
  transactions,
  onNavigate,
}: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState("home");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Handle navigation based on tab
    const routes: Record<string, string> = {
      home: "/dashboard",
      stats: "/dre",
      cards: "/contas-bancarias",
      settings: "/configuracoes",
    };
    onNavigate?.(routes[tabId] || "/dashboard");
  };

  return (
    <div className="min-h-screen bg-glass-void relative">
      {/* Ambient Background */}
      <AmbientBackground intensity="subtle" />

      {/* Header */}
      <MobileHeader
        userName={userName}
        avatarUrl={avatarUrl}
        notificationCount={notificationCount}
        onNotificationClick={() => onNavigate?.("/notificacoes")}
      />

      {/* Content */}
      <main className="relative z-10 px-4 py-4 space-y-4 pb-28">
        {/* Balance Hero with Period Selector */}
        <MobileBalanceHero
          totalBalance={totalBalance}
          change={balanceChange}
          receitas={receitas}
          despesas={despesas}
          economia={receitas - despesas}
          currencySymbol={currencySymbol}
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />

        {/* Quick Actions */}
        <MobileQuickActions />

        {/* Mini Chart */}
        <MobileMiniChart
          currencySymbol={currencySymbol}
          onViewDetails={() => onNavigate?.("/fluxo-caixa")}
        />

        {/* Recent Transactions */}
        <MobileTransactions
          transactions={transactions}
          currencySymbol={currencySymbol}
          onViewAll={() => onNavigate?.("/transacoes")}
        />

        {/* Goals */}
        <MobileGoals />
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
});

MobileDashboard.displayName = 'MobileDashboard';
