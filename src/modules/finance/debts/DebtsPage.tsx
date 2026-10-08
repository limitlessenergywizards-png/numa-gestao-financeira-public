'use client';

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown } from "lucide-react";
import { DebtDashboard } from "./components/DebtDashboard";
import { DebtList } from "./components/DebtList";
import { NewDebtDialog } from "./components/NewDebtDialog";
import { DebtDetailDialog } from "./components/DebtDetailDialog";
import { DebtPaymentDialog } from "./components/DebtPaymentDialog";
import { DebtSimulationDialog } from "./components/DebtSimulationDialog";
import { Separator } from "@/components/ui/separator";
import type { Debt } from "./services/debtCalculationEngine";

export default function DebtsPage() {
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [simulationOpen, setSimulationOpen] = useState(false);

    const handleViewDetail = (debt: Debt) => {
        setSelectedDebt(debt);
        setDetailOpen(true);
    };

    const handlePay = (debt: Debt) => {
        setSelectedDebt(debt);
        setDetailOpen(false); // Close detail if open
        setPaymentOpen(true);
    };

    const handleSimulate = (debt: Debt) => {
        setSelectedDebt(debt);
        setDetailOpen(false); // Close detail if open
        setSimulationOpen(true);
    };

    const handleEdit = (debt: Debt) => {
        setSelectedDebt(debt);
        setIsNewDialogOpen(true);
    };

    return (
        <AppLayout>
            <div className="space-y-6 pb-10">
                <div
                    className="rounded-xl border border-border/50 shadow-md overflow-hidden bg-card/50 dark:bg-background dark:border-emerald-900/40 animate-fade-in"
                >
                    <div
                        className="flex items-center justify-between px-5 py-4 border-b border-border/50 dark:border-emerald-800/30 bg-background dark:bg-none"
                        style={{
                            background: undefined, // Will be overridden by inline if dark
                        }}
                        ref={(el) => {
                            if (el) {
                                if (document.documentElement.classList.contains('dark')) {
                                    el.style.background = 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)';
                                    el.style.boxShadow = '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)';
                                } else {
                                    el.style.background = 'transparent';
                                    el.style.boxShadow = 'none';
                                }
                            }
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#1a2e25] dark:text-emerald-100/90 tracking-tight">
                                    Gestão de Dívidas
                                </h1>
                                <p className="text-sm text-[#6b8c80] dark:text-emerald-400/70 font-medium">
                                    Visão geral e controle de empréstimos, financiamentos e passivos financeiros
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                setSelectedDebt(null);
                                setIsNewDialogOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20 h-9 px-4 rounded-lg font-semibold text-sm transition-colors"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Dívida
                        </Button>
                    </div>

                    <div className="p-6 bg-card dark:bg-card/30 backdrop-blur-sm">
                        <DebtDashboard />
                    </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold tracking-tight">Listagem de Dívidas</h2>
                    <DebtList
                        onViewDetail={handleViewDetail}
                        onPay={handlePay}
                        onSimulate={handleSimulate}
                        onEdit={handleEdit}
                        onDeleteSuccess={() => {
                            setSelectedDebt(null);
                            setDetailOpen(false);
                        }}
                    />
                </div>

                {/* Dialogs */}
                <NewDebtDialog
                    debt={selectedDebt}
                    open={isNewDialogOpen}
                    onOpenChange={setIsNewDialogOpen}
                    onSuccess={() => setIsNewDialogOpen(false)}
                />
                <DebtDetailDialog
                    debt={selectedDebt}
                    open={detailOpen}
                    onOpenChange={setDetailOpen}
                    onPay={handlePay}
                    onSimulate={handleSimulate}
                />
                <DebtPaymentDialog
                    debt={selectedDebt}
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                />
                <DebtSimulationDialog
                    debt={selectedDebt}
                    open={simulationOpen}
                    onOpenChange={setSimulationOpen}
                />
            </div>
        </AppLayout>
    );
}
