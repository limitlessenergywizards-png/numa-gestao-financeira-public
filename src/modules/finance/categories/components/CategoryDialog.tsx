'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CategoryColorPicker } from "./CategoryColorPicker";
import { CategoryIconPicker } from "./CategoryIconPicker";
import type { Category, CategoryInsert } from "../hooks/useCategories";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  type: z.enum(["receita", "despesa", "ambos"], {
    required_error: "Selecione um tipo",
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  icon: z.string().min(1, "Selecione um ícone"),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  companyId: string;
  onSubmit: (data: CategoryInsert | (Partial<CategoryInsert> & { id: string })) => void;
  isSubmitting: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  companyId,
  onSubmit,
  isSubmitting,
}: CategoryDialogProps) {
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "despesa",
      color: "#6366f1",
      icon: "tag",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          is_active: category.is_active,
        });
      } else {
        form.reset({
          name: "",
          type: "despesa",
          color: "#6366f1",
          icon: "tag",
          is_active: true,
        });
      }
    }
  }, [open, category, form]);

  const handleSubmit = (data: CategoryFormData) => {
    if (isEditing && category) {
      onSubmit({ 
        id: category.id, 
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        is_active: data.is_active,
      });
    } else {
      onSubmit({ 
        company_id: companyId,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        is_active: data.is_active,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Alimentação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <CategoryColorPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone</FormLabel>
                  <FormControl>
                    <CategoryIconPicker
                      value={field.value}
                      onChange={field.onChange}
                      color={form.watch("color")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Categorias inativas não aparecem nas seleções
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
