'use client';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useCategoriesQuery, useBankAccountsQuery, useCreateRecurringMutation } from "../hooks/useCreateRecurring";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TransactionType } from "../types";

const formSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    amount: z.string()
        .transform((val) => Number(val.replace(/[^0-9,-]+/g, "").replace(",", ".")))
        .refine((val) => !isNaN(val), "Valor inválido")
        .refine((val) => val > 0, "Valor deve ser positivo")
        .refine((val) => val <= 999999999.99, "Valor máximo excedido"),
    type: z.enum(["receita", "despesa"]),
    category_id: z.string().uuid("Selecione uma categoria"),
    bank_account_id: z.string().uuid("Selecione uma conta bancária").optional().or(z.literal("")),
    frequency: z.enum(['diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'personalizada']),
    start_date: z.string(),
    end_date: z.string().optional(),
    day_of_month: z.number().min(1).max(31).optional(),
    create_as_forecast: z.boolean().default(true),
    skip_weekends: z.boolean().default(false),
});

export function NewRecurringDialog() {
    const [open, setOpen] = useState(false);
    const { createRecurring, toast } = useCreateRecurringMutation();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            amount: 0,
            type: "despesa",
            frequency: "mensal",
            create_as_forecast: true,
            skip_weekends: false,
        },
    });

    const { data: categories } = useCategoriesQuery();
    const { data: bankAccounts } = useBankAccountsQuery();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await createRecurring(values as any);
            toast({ title: "Recorrência criada com sucesso!" });
            setOpen(false);
            form.reset();
        } catch (error: unknown) {
            toast({
                title: "Erro ao criar recorrência",
                description: error instanceof Error ? error.message : String(error),
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Recorrência
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nova Recorrência</DialogTitle>
                    <DialogDescription>
                        Configure uma nova transação recorrente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Aluguel, Salário..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor</FormLabel>
                                        <FormControl>
                                            {/* Simple currency input handling for MVP */}
                                            <Input
                                                placeholder="R$ 0,00"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                type="number"
                                                step="0.01"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="receita">Receita</SelectItem>
                                                <SelectItem value="despesa">Despesa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories?.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="bank_account_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conta Bancária (Opcional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a conta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {bankAccounts?.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequência</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="diaria">Diária</SelectItem>
                                                <SelectItem value="semanal">Semanal</SelectItem>
                                                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                                                <SelectItem value="mensal">Mensal</SelectItem>
                                                <SelectItem value="anual">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Início</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <FormField
                                control={form.control}
                                name="create_as_forecast"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Gerar como Previsão
                                            </FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                Se ativo, cria lançamentos com nature='previsao'. Se inativo, nature='realizado'.
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">Criar Recorrência</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
