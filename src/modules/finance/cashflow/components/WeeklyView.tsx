'use client';

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { WeeklyData } from "./CashFlowTypes";

interface WeeklyViewProps {
  weeklyData: WeeklyData[];
  formatCurrency: (value: number) => string;
}

export function WeeklyView({ weeklyData, formatCurrency }: WeeklyViewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekNumber)
        ? prev.filter((w) => w !== weekNumber)
        : [...prev, weekNumber]
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Fluxo Semanal</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Clique em uma semana para ver os detalhes diários</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 p-2 sm:p-6">
        {weeklyData.map((week) => (
          <Collapsible
            key={week.weekNumber}
            open={expandedWeeks.includes(week.weekNumber)}
            onOpenChange={() => toggleWeek(week.weekNumber)}
          >
            <CollapsibleTrigger asChild>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  {expandedWeeks.includes(week.weekNumber) ? (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{week.weekLabel}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {format(parseISO(week.startDate), "dd/MM")} - {format(parseISO(week.endDate), "dd/MM")}
                    </div>
                  </div>
                </div>
                
                {/* Summary - Grid 2x2 on mobile, row on desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Saldo Inicial</div>
                    <div className="font-medium font-mono">{formatCurrency(week.saldoInicial)}</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Entradas</div>
                    <div className="font-medium text-success font-mono">+{formatCurrency(week.entradas)}</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Saídas</div>
                    <div className="font-medium text-destructive font-mono">-{formatCurrency(week.saidas)}</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Saldo Final</div>
                    <div className={`font-bold font-mono ${week.saldoFinal >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(week.saldoFinal)}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 sm:pl-8 pt-2">
              <ScrollArea className="w-full">
                <div className="min-w-[500px]">
                  <Table>
                    <TableHeader className="[&_th]:!bg-gradient-to-r [&_th]:from-[#C5A059] [&_th]:via-[#E8D5A8] [&_th]:to-[#C5A059] [&_th]:!text-[#1a1a1a] [&_th]:!font-bold [&_th]:!text-[13px] [&_th]:!tracking-wide [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
                      <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="w-[80px] sm:w-[100px]">Data</TableHead>
                        <TableHead className="min-w-[150px]">Descrição</TableHead>
                        <TableHead className="text-right w-[80px] sm:w-[100px]">Entrada</TableHead>
                        <TableHead className="text-right w-[80px] sm:w-[100px]">Saída</TableHead>
                        <TableHead className="text-right w-[80px] sm:w-[100px]">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {week.days.flatMap((day) =>
                        day.transactions.map((tx) => (
                          <TableRow key={tx.id} className={tx.isProjected ? 'italic opacity-80' : ''}>
                            <TableCell className="font-medium text-xs sm:text-sm">
                              {format(parseISO(day.date), "dd/MM EEE", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="line-clamp-2 sm:line-clamp-1">{tx.description}</span>
                                {tx.isProjected && (
                                  <Badge variant="outline" className="text-[10px] sm:text-xs w-fit">Projetado</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-success text-xs sm:text-sm font-mono">
                              {tx.type === 'entrada' ? formatCurrency(tx.amount) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-destructive text-xs sm:text-sm font-mono">
                              {tx.type === 'saida' ? formatCurrency(tx.amount) : '-'}
                            </TableCell>
                            <TableCell className={`text-right font-medium text-xs sm:text-sm font-mono ${day.saldoAcumulado >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(day.saldoAcumulado)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {week.days.every((d) => d.transactions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                            Nenhuma movimentação nesta semana
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        ))}
        {weeklyData.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Nenhum dado para o período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
