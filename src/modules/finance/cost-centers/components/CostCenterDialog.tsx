'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { CostCenter, CreateCostCenterData, UpdateCostCenterData } from "../hooks/useCostCenters";
import { Loader2 } from "lucide-react";

const costCenterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  code: z.string().min(1, "Código é obrigatório").max(20),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof costCenterSchema>;

interface CostCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenter?: CostCenter | null;
  onSubmit: (data: CreateCostCenterData | UpdateCostCenterData) => Promise<boolean | CostCenter | null>;
}

const colorPresets = [
  "#C5A059", // Gold (brand)
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
];

export function CostCenterDialog({
  open,
  onOpenChange,
  costCenter,
  onSubmit,
}: CostCenterDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!costCenter;

  const form = useForm<FormData>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      color: "#C5A059",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (costCenter) {
        form.reset({
          name: costCenter.name,
          code: costCenter.code,
          description: costCenter.description || "",
          color: costCenter.color,
          is_active: costCenter.is_active,
        });
      } else {
        form.reset({
          name: "",
          code: "",
          description: "",
          color: "#C5A059",
          is_active: true,
        });
      }
    }
  }, [open, costCenter, form]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || undefined,
        color: data.color,
        is_active: data.is_active,
      });

      if (result !== false && result !== null) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Centro de Custo" : "Novo Centro de Custo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do centro de custo."
              : "Crie um novo centro de custo para agrupar despesas."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: CC001"
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>Código único para identificar o centro</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Obra Eusébio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descrição opcional do centro de custo..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className="w-8 h-8 rounded-full border-2 transition-[border-color,box-shadow]"
                            style={{
                              backgroundColor: color,
                              borderColor: field.value === color ? "white" : "transparent",
                              boxShadow: field.value === color ? "0 0 0 2px hsl(var(--brand))" : "none",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          {...field}
                          placeholder="#C5A059"
                          className="flex-1 font-mono uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">Ativo</FormLabel>
                    <FormDescription>
                      Centros inativos não aparecem nas listas de seleção
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
