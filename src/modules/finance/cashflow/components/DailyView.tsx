import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DailyDetail } from "./CashFlowTypes";
import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyViewProps {
  dailyData: DailyDetail[];
  formatCurrency: (value: number) => string;
  saldoInicial: number;
}

export function DailyView({ dailyData, formatCurrency, saldoInicial }: DailyViewProps) {
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Fluxo Diário Detalhado</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Cada movimentação com descrição completa</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="[&_th]:!bg-gradient-to-r [&_th]:from-[#C5A059] [&_th]:via-[#E8D5A8] [&_th]:to-[#C5A059] [&_th]:!text-[#1a1a1a] [&_th]:!font-bold [&_th]:!text-[13px] [&_th]:!tracking-wide [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
                <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="w-[70px] sm:w-[100px]">Data</TableHead>
                  <TableHead className="min-w-[120px] sm:min-w-[180px]">Descrição</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[120px]">Categoria</TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[100px]">Entrada</TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[100px]">Saída</TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[100px]">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Saldo Inicial */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-medium text-xs sm:text-sm">
                    Saldo Inicial
                  </TableCell>
                  <TableCell className={`text-right font-bold text-xs sm:text-sm ${saldoInicial >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(saldoInicial)}
                  </TableCell>
                </TableRow>

                {dailyData.map((day) => (
                  <>
                    {/* Transactions for the day */}
                    {day.transactions.length > 0 && day.transactions.map((tx, idx) => (
                      <TableRow key={tx.id} className={tx.isProjected ? 'italic opacity-80' : ''}>
                        {idx === 0 && (
                          <TableCell rowSpan={day.transactions.length} className="align-top font-medium border-r text-xs sm:text-sm">
                            <div>{format(parseISO(day.date), "dd/MM", { locale: ptBR })}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {format(parseISO(day.date), "EEE", { locale: ptBR })}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className={cn(
                              "line-clamp-2 sm:line-clamp-1",
                              tx.isProjected && "italic text-muted-foreground"
                            )}>
                              {tx.description}
                            </span>
                            {tx.isProjected ? (
                              <Badge variant="outline" className="text-[10px] sm:text-xs w-fit gap-1 border-dashed">
                                <Clock className="h-3 w-3" />
                                Projetado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs w-fit gap-1 bg-success/10 text-success border-0">
                                <CheckCircle2 className="h-3 w-3" />
                                Realizado
                              </Badge>
                            )}
                          </div>
                          {/* Show category on mobile */}
                          <div className="md:hidden text-[10px] text-muted-foreground mt-0.5">
                            {tx.categoryCode ? `${tx.categoryCode} - ${tx.category}` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                          {tx.categoryCode ? `${tx.categoryCode} - ${tx.category}` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-success text-xs sm:text-sm font-mono">
                          {tx.type === 'entrada' ? formatCurrency(tx.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-destructive text-xs sm:text-sm font-mono">
                          {tx.type === 'saida' ? formatCurrency(tx.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">-</TableCell>
                      </TableRow>
                    ))}

                    {/* Day subtotal */}
                    {(day.entradas > 0 || day.saidas > 0) && (
                      <TableRow className="bg-muted/30 border-b-2">
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {day.transactions.length === 0 && format(parseISO(day.date), "dd/MM", { locale: ptBR })}
                        </TableCell>
                        <TableCell colSpan={2} className="font-medium text-muted-foreground text-xs sm:text-sm">
                          <span className="hidden sm:inline">Subtotal </span>
                          {format(parseISO(day.date), "dd/MM")}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success text-xs sm:text-sm font-mono">
                          {day.entradas > 0 ? formatCurrency(day.entradas) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive text-xs sm:text-sm font-mono">
                          {day.saidas > 0 ? formatCurrency(day.saidas) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-bold text-xs sm:text-sm font-mono ${day.saldoAcumulado >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(day.saldoAcumulado)}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
