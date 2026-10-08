'use client';

import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DelinquencyItem {
  name: string;
  amount: number;
  count?: number;
}

interface DelinquencyTableProps {
  title: string;
  entityLabel: string;
  byEntity: DelinquencyItem[];
  upcoming: DelinquencyItem[];
  overdue: DelinquencyItem[];
  currencySymbol: string;
}

export const DelinquencyTable = memo(function DelinquencyTable({
  title,
  entityLabel,
  byEntity,
  upcoming,
  overdue,
  currencySymbol,
}: DelinquencyTableProps) {
  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000000) {
      return `${currencySymbol} ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${currencySymbol} ${(value / 1000).toFixed(1)}k`;
    }
    return `${currencySymbol} ${value.toFixed(2)}`;
  }, [currencySymbol]);

  const renderTable = (data: DelinquencyItem[], showCount = false) => (
    <ScrollArea className="h-[200px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{entityLabel}</TableHead>
            {showCount && <TableHead className="text-center">Qtd</TableHead>}
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={showCount ? 3 : 2} 
                className="text-center text-muted-foreground py-8"
              >
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            data.slice(0, 10).map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium truncate max-w-[150px]">
                  {item.name}
                </TableCell>
                {showCount && (
                  <TableCell className="text-center">{item.count || 1}</TableCell>
                )}
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <Tabs defaultValue="byEntity" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="byEntity" className="text-xs py-2 px-1">
              {title}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs py-2 px-1">
              Próximos a vencer
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs py-2 px-1">
              Vencidos
            </TabsTrigger>
          </TabsList>
          <CardContent className="pt-4 px-0">
            <TabsContent value="byEntity" className="mt-0">
              {renderTable(byEntity, true)}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-0">
              {renderTable(upcoming)}
            </TabsContent>
            <TabsContent value="overdue" className="mt-0">
              {renderTable(overdue)}
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
});
