'use client';


import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type NatureFilter } from "@/modules/finance/transactions/hooks/useTransactionsData";
import { Target, CheckCircle2, ListFilter } from "lucide-react";

interface NatureFilterProps {
    value: NatureFilter;
    onChange: (value: NatureFilter) => void;
}

export function NatureFilterSelector({ value, onChange }: NatureFilterProps) {
    return (
        <Tabs
            value={value}
            onValueChange={(val) => onChange(val as NatureFilter)}
            className="w-auto"
        >
            <TabsList className="grid w-full grid-cols-3 min-w-[300px]">
                <TabsTrigger value="all" className="flex gap-2 items-center">
                    <ListFilter className="w-3.5 h-3.5" />
                    Todos
                </TabsTrigger>
                <TabsTrigger value="realizado" className="flex gap-2 items-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Realizado
                </TabsTrigger>
                <TabsTrigger value="previsao" className="flex gap-2 items-center">
                    <Target className="w-3.5 h-3.5" />
                    Previsão
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
