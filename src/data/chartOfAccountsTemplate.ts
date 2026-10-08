import type { Database } from "@/integrations/supabase/types";

type AccountEntryType = Database["public"]["Enums"]["account_entry_type"];

export interface ChartAccountTemplate {
  code: string;
  name: string;
  type: AccountEntryType;
  dre_category: string;
  children?: ChartAccountTemplate[];
}

export const defaultChartTemplate: ChartAccountTemplate[] = [
  {
    code: "1",
    name: "RECEITAS",
    type: "receita",
    dre_category: "Receita Bruta",
    children: [
      {
        code: "1.1",
        name: "Receita de Vendas",
        type: "receita",
        dre_category: "Receita Bruta",
        children: [
          { code: "1.1.01", name: "Venda de Produtos", type: "receita", dre_category: "Receita Bruta" },
          { code: "1.1.02", name: "Venda de Mercadorias", type: "receita", dre_category: "Receita Bruta" },
        ]
      },
      {
        code: "1.2",
        name: "Receita de Serviços",
        type: "receita",
        dre_category: "Receita Bruta",
        children: [
          { code: "1.2.01", name: "Prestação de Serviços", type: "receita", dre_category: "Receita Bruta" },
          { code: "1.2.02", name: "Consultoria", type: "receita", dre_category: "Receita Bruta" },
        ]
      },
      {
        code: "1.3",
        name: "Receitas Financeiras",
        type: "receita",
        dre_category: "Receitas Financeiras",
        children: [
          { code: "1.3.01", name: "Juros Recebidos", type: "receita", dre_category: "Receitas Financeiras" },
          { code: "1.3.02", name: "Rendimentos de Aplicações", type: "receita", dre_category: "Receitas Financeiras" },
          { code: "1.3.03", name: "Descontos Obtidos", type: "receita", dre_category: "Receitas Financeiras" },
        ]
      },
      {
        code: "1.4",
        name: "Outras Receitas",
        type: "receita",
        dre_category: "Outras Receitas",
        children: [
          { code: "1.4.01", name: "Receitas Eventuais", type: "receita", dre_category: "Outras Receitas" },
        ]
      },
    ]
  },
  {
    code: "2",
    name: "DEDUÇÕES",
    type: "despesa",
    dre_category: "Deduções",
    children: [
      {
        code: "2.1",
        name: "Impostos sobre Vendas",
        type: "despesa",
        dre_category: "Deduções",
        children: [
          { code: "2.1.01", name: "ISS", type: "despesa", dre_category: "Deduções" },
          { code: "2.1.02", name: "PIS", type: "despesa", dre_category: "Deduções" },
          { code: "2.1.03", name: "COFINS", type: "despesa", dre_category: "Deduções" },
          { code: "2.1.04", name: "ICMS", type: "despesa", dre_category: "Deduções" },
          { code: "2.1.05", name: "IPI", type: "despesa", dre_category: "Deduções" },
        ]
      },
      { code: "2.2", name: "Devoluções e Abatimentos", type: "despesa", dre_category: "Deduções" },
    ]
  },
  {
    code: "3",
    name: "CUSTOS",
    type: "custo",
    dre_category: "Custos",
    children: [
      { code: "3.1", name: "Custo das Mercadorias Vendidas (CMV)", type: "custo", dre_category: "Custos" },
      { code: "3.2", name: "Custo dos Produtos Vendidos (CPV)", type: "custo", dre_category: "Custos" },
      { code: "3.3", name: "Custo dos Serviços Prestados (CSP)", type: "custo", dre_category: "Custos" },
    ]
  },
  {
    code: "4",
    name: "DESPESAS OPERACIONAIS",
    type: "despesa",
    dre_category: "Despesas Operacionais",
    children: [
      {
        code: "4.1",
        name: "Despesas Administrativas",
        type: "despesa",
        dre_category: "Despesas Operacionais",
        children: [
          { code: "4.1.01", name: "Aluguel", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.02", name: "Condomínio", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.03", name: "IPTU", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.04", name: "Energia Elétrica", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.05", name: "Água e Esgoto", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.06", name: "Telefone e Internet", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.07", name: "Material de Escritório", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.08", name: "Serviços de Terceiros", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.09", name: "Manutenção e Reparos", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.10", name: "Seguros", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.1.11", name: "Assinaturas e Mensalidades", type: "despesa", dre_category: "Despesas Operacionais" },
        ]
      },
      {
        code: "4.2",
        name: "Despesas com Pessoal",
        type: "despesa",
        dre_category: "Despesas Operacionais",
        children: [
          { code: "4.2.01", name: "Salários e Ordenados", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.02", name: "Pró-labore", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.03", name: "INSS", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.04", name: "FGTS", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.05", name: "13º Salário", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.06", name: "Férias", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.07", name: "Vale Transporte", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.08", name: "Vale Refeição", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.09", name: "Plano de Saúde", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.2.10", name: "Outros Benefícios", type: "despesa", dre_category: "Despesas Operacionais" },
        ]
      },
      {
        code: "4.3",
        name: "Despesas Financeiras",
        type: "despesa",
        dre_category: "Despesas Financeiras",
        children: [
          { code: "4.3.01", name: "Juros Pagos", type: "despesa", dre_category: "Despesas Financeiras" },
          { code: "4.3.02", name: "Tarifas Bancárias", type: "despesa", dre_category: "Despesas Financeiras" },
          { code: "4.3.03", name: "IOF", type: "despesa", dre_category: "Despesas Financeiras" },
          { code: "4.3.04", name: "Multas e Juros de Mora", type: "despesa", dre_category: "Despesas Financeiras" },
          { code: "4.3.05", name: "Descontos Concedidos", type: "despesa", dre_category: "Despesas Financeiras" },
        ]
      },
      {
        code: "4.4",
        name: "Despesas com Vendas/Marketing",
        type: "despesa",
        dre_category: "Despesas Operacionais",
        children: [
          { code: "4.4.01", name: "Publicidade e Propaganda", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.4.02", name: "Comissões", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.4.03", name: "Frete sobre Vendas", type: "despesa", dre_category: "Despesas Operacionais" },
          { code: "4.4.04", name: "Brindes e Amostras", type: "despesa", dre_category: "Despesas Operacionais" },
        ]
      },
    ]
  },
  {
    code: "5",
    name: "OUTRAS RECEITAS/DESPESAS",
    type: "despesa",
    dre_category: "Outras Receitas/Despesas",
    children: [
      { code: "5.1", name: "Receitas Não Operacionais", type: "receita", dre_category: "Outras Receitas" },
      { code: "5.2", name: "Despesas Não Operacionais", type: "despesa", dre_category: "Outras Despesas" },
    ]
  },
];

// Count total categories in template
function _countCategories(items: ChartAccountTemplate[]): number {
  let count = 0;
  for (const item of items) {
    count++;
    if (item.children) {
      count += _countCategories(item.children);
    }
  }
  return count;
}

/** Pre-computed constant — template never changes at runtime */
export const TEMPLATE_CATEGORY_COUNT = _countCategories(defaultChartTemplate);

/** @deprecated Use TEMPLATE_CATEGORY_COUNT instead */
export function countTemplateCategories(): number {
  return TEMPLATE_CATEGORY_COUNT;
}
