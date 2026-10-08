import type { TemplateAccount, TemplateDREMapping } from "./types";

// Helper to create account entries concisely
function a(
  code: string,
  name: string,
  type: TemplateAccount["type"],
  nature: TemplateAccount["nature"],
  level: number,
  parentCode: string | null,
  isAnalytical: boolean,
  dreCategory: string | null = null
): TemplateAccount {
  return { code, name, type, nature, level, parentCode, isAnalytical, dreCategory };
}

/**
 * Template Padrão Simplificado — Balanço Patrimonial Completo
 * Baseado na Resolução CFC 1.418/2012
 * ~80 contas cobrindo Ativo, Passivo, PL e Resultado (DRE)
 */
export const baseAccounts: TemplateAccount[] = [
  // ═══════════════════════════════════════════
  // 1. ATIVO
  // ═══════════════════════════════════════════
  a("1",       "ATIVO",                          "ativo", "devedora", 1, null,  false),

  // 1.1 Ativo Circulante
  a("1.1",     "Ativo Circulante",               "ativo", "devedora", 2, "1",   false),
  a("1.1.1",   "Caixa e Equivalentes de Caixa",  "ativo", "devedora", 3, "1.1", false),
  a("1.1.1.01","Caixa",                          "ativo", "devedora", 4, "1.1.1", true),
  a("1.1.1.02","Bancos Conta Movimento",          "ativo", "devedora", 4, "1.1.1", true),
  a("1.1.1.03","Aplicações de Liquidez Imediata", "ativo", "devedora", 4, "1.1.1", true),

  a("1.1.2",   "Contas a Receber",               "ativo", "devedora", 3, "1.1", false),
  a("1.1.2.01","Clientes",                       "ativo", "devedora", 4, "1.1.2", true),
  a("1.1.2.02","(-) Perdas Estimadas com Créditos","ativo","credora", 4, "1.1.2", true),

  a("1.1.3",   "Estoques",                       "ativo", "devedora", 3, "1.1", false),
  a("1.1.3.01","Produtos Acabados",              "ativo", "devedora", 4, "1.1.3", true),
  a("1.1.3.02","Insumos",                        "ativo", "devedora", 4, "1.1.3", true),

  a("1.1.4",   "Outros Créditos",                "ativo", "devedora", 3, "1.1", false),
  a("1.1.4.01","Títulos a Receber",              "ativo", "devedora", 4, "1.1.4", true),
  a("1.1.4.02","Impostos a Recuperar",           "ativo", "devedora", 4, "1.1.4", true),
  a("1.1.4.03","Adiantamentos a Fornecedores",   "ativo", "devedora", 4, "1.1.4", true),

  // 1.3 Ativo Não Circulante
  a("1.3",     "Ativo Não Circulante",            "ativo", "devedora", 2, "1",   false),

  a("1.3.1",   "Realizável a Longo Prazo",       "ativo", "devedora", 3, "1.3", false),
  a("1.3.1.01","Contas a Receber LP",            "ativo", "devedora", 4, "1.3.1", true),

  a("1.3.2",   "Investimentos",                  "ativo", "devedora", 3, "1.3", false),
  a("1.3.2.01","Participações Societárias",      "ativo", "devedora", 4, "1.3.2", true),

  a("1.3.3",   "Imobilizado",                    "ativo", "devedora", 3, "1.3", false),
  a("1.3.3.01","Terrenos",                       "ativo", "devedora", 4, "1.3.3", true),
  a("1.3.3.02","Edificações",                    "ativo", "devedora", 4, "1.3.3", true),
  a("1.3.3.03","Máquinas e Equipamentos",        "ativo", "devedora", 4, "1.3.3", true),
  a("1.3.3.04","Veículos",                       "ativo", "devedora", 4, "1.3.3", true),
  a("1.3.3.05","Móveis e Utensílios",            "ativo", "devedora", 4, "1.3.3", true),
  a("1.3.3.06","Equipamentos de Informática",    "ativo", "devedora", 4, "1.3.3", true),
  a("1.3.3.99","(-) Depreciação Acumulada",      "ativo", "credora",  4, "1.3.3", true),

  a("1.3.4",   "Intangível",                     "ativo", "devedora", 3, "1.3", false),
  a("1.3.4.01","Softwares e Licenças",           "ativo", "devedora", 4, "1.3.4", true),
  a("1.3.4.02","Marcas e Patentes",              "ativo", "devedora", 4, "1.3.4", true),
  a("1.3.4.99","(-) Amortização Acumulada",      "ativo", "credora",  4, "1.3.4", true),

  // ═══════════════════════════════════════════
  // 2. PASSIVO E PATRIMÔNIO LÍQUIDO
  // ═══════════════════════════════════════════
  a("2",       "PASSIVO E PATRIMÔNIO LÍQUIDO",   "passivo", "credora", 1, null,  false),

  // 2.1 Passivo Circulante
  a("2.1",     "Passivo Circulante",             "passivo", "credora", 2, "2",   false),

  a("2.1.1",   "Fornecedores",                  "passivo", "credora", 3, "2.1", false),
  a("2.1.1.01","Fornecedores Nacionais",         "passivo", "credora", 4, "2.1.1", true),

  a("2.1.2",   "Empréstimos e Financiamentos",  "passivo", "credora", 3, "2.1", false),
  a("2.1.2.01","Empréstimos Bancários CP",       "passivo", "credora", 4, "2.1.2", true),
  a("2.1.2.02","Financiamentos CP",              "passivo", "credora", 4, "2.1.2", true),

  a("2.1.3",   "Obrigações Fiscais",            "passivo", "credora", 3, "2.1", false),
  a("2.1.3.01","SIMPLES Nacional a Recolher",    "passivo", "credora", 4, "2.1.3", true),
  a("2.1.3.02","ICMS a Recolher",               "passivo", "credora", 4, "2.1.3", true),
  a("2.1.3.03","ISS a Recolher",                "passivo", "credora", 4, "2.1.3", true),
  a("2.1.3.04","PIS a Recolher",                "passivo", "credora", 4, "2.1.3", true),
  a("2.1.3.05","COFINS a Recolher",             "passivo", "credora", 4, "2.1.3", true),
  a("2.1.3.06","IRPJ a Recolher",               "passivo", "credora", 4, "2.1.3", true),
  a("2.1.3.07","CSLL a Recolher",               "passivo", "credora", 4, "2.1.3", true),

  a("2.1.4",   "Obrigações Trabalhistas",        "passivo", "credora", 3, "2.1", false),
  a("2.1.4.01","Salários a Pagar",              "passivo", "credora", 4, "2.1.4", true),
  a("2.1.4.02","FGTS a Recolher",               "passivo", "credora", 4, "2.1.4", true),
  a("2.1.4.03","INSS a Recolher",               "passivo", "credora", 4, "2.1.4", true),

  a("2.1.5",   "Contas a Pagar",                "passivo", "credora", 3, "2.1", false),
  a("2.1.5.01","Aluguéis a Pagar",              "passivo", "credora", 4, "2.1.5", true),
  a("2.1.5.02","Energia/Água a Pagar",          "passivo", "credora", 4, "2.1.5", true),
  a("2.1.5.03","Outras Contas a Pagar",         "passivo", "credora", 4, "2.1.5", true),

  a("2.1.6",   "Provisões",                     "passivo", "credora", 3, "2.1", false),
  a("2.1.6.01","Provisão de Férias",             "passivo", "credora", 4, "2.1.6", true),
  a("2.1.6.02","Provisão de 13º Salário",        "passivo", "credora", 4, "2.1.6", true),

  // 2.2 Passivo Não Circulante
  a("2.2",     "Passivo Não Circulante",         "passivo", "credora", 2, "2",   false),
  a("2.2.1",   "Financiamentos LP",             "passivo", "credora", 3, "2.2", false),
  a("2.2.1.01","Financiamentos Bancários LP",    "passivo", "credora", 4, "2.2.1", true),
  a("2.2.2",   "Outras Obrigações LP",          "passivo", "credora", 3, "2.2", false),
  a("2.2.2.01","Empréstimos de Sócios",          "passivo", "credora", 4, "2.2.2", true),

  // 2.3 Patrimônio Líquido
  a("2.3",     "Patrimônio Líquido",             "patrimonio", "credora", 2, "2",   false),

  a("2.3.1",   "Capital Social",                "patrimonio", "credora", 3, "2.3", false),
  a("2.3.1.01","Capital Subscrito",              "patrimonio", "credora", 4, "2.3.1", true),
  a("2.3.1.02","(-) Capital a Integralizar",     "patrimonio", "devedora",4, "2.3.1", true),

  a("2.3.2",   "Reservas",                      "patrimonio", "credora", 3, "2.3", false),
  a("2.3.2.01","Reservas de Capital",            "patrimonio", "credora", 4, "2.3.2", true),
  a("2.3.2.02","Reservas de Lucros",             "patrimonio", "credora", 4, "2.3.2", true),

  a("2.3.3",   "Lucros/Prejuízos Acumulados",   "patrimonio", "credora", 3, "2.3", false),
  a("2.3.3.01","Lucros Acumulados",              "patrimonio", "credora", 4, "2.3.3", true),
  a("2.3.3.02","(-) Prejuízos Acumulados",       "patrimonio", "devedora",4, "2.3.3", true),

  // ═══════════════════════════════════════════
  // 3. RESULTADO (DRE)
  // ═══════════════════════════════════════════
  a("3",       "RESULTADO",                      "receita", "credora", 1, null,  false),

  // 3.1 Receitas
  a("3.1",     "Receitas",                       "receita", "credora", 2, "3",   false),

  a("3.1.1",   "Receitas de Venda",              "receita", "credora", 3, "3.1", false, "Receita Bruta"),
  a("3.1.1.01","Venda de Produtos",              "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.02","Venda de Mercadorias",           "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.03","Prestação de Serviços",          "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),

  a("3.1.1.50","(-) Deduções de Tributos",       "receita", "devedora",4, "3.1.1", true, "Deduções"),
  a("3.1.1.51","(-) Devoluções e Abatimentos",   "receita", "devedora",4, "3.1.1", true, "Deduções"),

  a("3.1.2",   "Receitas Financeiras",           "receita", "credora", 3, "3.1", false, "Receitas Financeiras"),
  a("3.1.2.01","Receitas de Aplicações",         "receita", "credora", 4, "3.1.2", true, "Receitas Financeiras"),
  a("3.1.2.02","Juros Ativos",                   "receita", "credora", 4, "3.1.2", true, "Receitas Financeiras"),
  a("3.1.2.03","Descontos Obtidos",              "receita", "credora", 4, "3.1.2", true, "Receitas Financeiras"),

  a("3.1.3",   "Outras Receitas Operacionais",   "receita", "credora", 3, "3.1", false, "Outras Receitas"),
  a("3.1.3.01","Receitas Eventuais",             "receita", "credora", 4, "3.1.3", true, "Outras Receitas"),

  // 3.2 Custos e Despesas
  a("3.2",     "Custos e Despesas",              "custo",   "devedora", 2, "3",   false),

  a("3.2.1",   "Custos dos Produtos/Serviços",  "custo",   "devedora", 3, "3.2", false, "Custos"),
  a("3.2.1.01","Custo das Mercadorias Vendidas (CMV)", "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.02","Custo dos Produtos Vendidos (CPV)",    "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.03","Custo dos Serviços Prestados (CSP)",   "custo", "devedora", 4, "3.2.1", true, "Custos"),

  a("3.2.2",   "Despesas Administrativas",      "despesa", "devedora", 3, "3.2", false, "Despesas Administrativas"),
  a("3.2.2.01","Aluguel",                       "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.02","Condomínio",                    "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.03","Energia Elétrica",              "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.04","Água e Esgoto",                 "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.05","Telefone e Internet",           "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.06","Material de Escritório",        "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.07","Serviços de Terceiros",         "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.08","Manutenção e Reparos",          "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.09","Seguros",                       "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.10","Assinaturas e Mensalidades",    "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),

  a("3.2.3",   "Despesas com Pessoal",          "despesa", "devedora", 3, "3.2", false, "Despesas com Pessoal"),
  a("3.2.3.01","Salários e Ordenados",          "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.02","Pró-labore",                    "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.03","INSS",                          "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.04","FGTS",                          "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.05","13º Salário",                   "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.06","Férias",                        "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.07","Vale Transporte",               "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.08","Vale Refeição",                 "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),
  a("3.2.3.09","Plano de Saúde",                "despesa", "devedora", 4, "3.2.3", true, "Despesas com Pessoal"),

  a("3.2.4",   "Despesas Financeiras",          "despesa", "devedora", 3, "3.2", false, "Despesas Financeiras"),
  a("3.2.4.01","Juros Pagos",                   "despesa", "devedora", 4, "3.2.4", true, "Despesas Financeiras"),
  a("3.2.4.02","Tarifas Bancárias",             "despesa", "devedora", 4, "3.2.4", true, "Despesas Financeiras"),
  a("3.2.4.03","IOF",                           "despesa", "devedora", 4, "3.2.4", true, "Despesas Financeiras"),
  a("3.2.4.04","Multas e Juros de Mora",        "despesa", "devedora", 4, "3.2.4", true, "Despesas Financeiras"),
  a("3.2.4.05","Descontos Concedidos",          "despesa", "devedora", 4, "3.2.4", true, "Despesas Financeiras"),

  a("3.2.5",   "Despesas com Vendas/Marketing", "despesa", "devedora", 3, "3.2", false, "Despesas Comerciais"),
  a("3.2.5.01","Publicidade e Propaganda",      "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.02","Comissões sobre Vendas",        "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.03","Frete sobre Vendas",            "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),

  a("3.2.6",   "Outras Despesas",               "despesa", "devedora", 3, "3.2", false, "Outras Despesas"),
  a("3.2.6.01","Despesas Eventuais",            "despesa", "devedora", 4, "3.2.6", true, "Outras Despesas"),
];

export const baseDREMapping: TemplateDREMapping[] = [
  { dreLineId: "receita_bruta",           dreLineName: "(+) RECEITA OPERACIONAL BRUTA",      accountCodes: ["3.1.1"],                    operation: "sum",        displayOrder: 1 },
  { dreLineId: "deducoes",                dreLineName: "(-) Deduções da Receita",             accountCodes: ["3.1.1.50", "3.1.1.51"],     operation: "subtract",   displayOrder: 2 },
  { dreLineId: "receita_liquida",         dreLineName: "= RECEITA OPERACIONAL LÍQUIDA",       accountCodes: [],                           operation: "calculated", displayOrder: 3 },
  { dreLineId: "custo_vendas",            dreLineName: "(-) Custo das Vendas/Serviços",       accountCodes: ["3.2.1"],                    operation: "subtract",   displayOrder: 4 },
  { dreLineId: "lucro_bruto",             dreLineName: "= LUCRO BRUTO",                       accountCodes: [],                           operation: "calculated", displayOrder: 5 },
  { dreLineId: "despesas_administrativas",dreLineName: "(-) Despesas Administrativas",        accountCodes: ["3.2.2"],                    operation: "subtract",   displayOrder: 6 },
  { dreLineId: "despesas_pessoal",        dreLineName: "(-) Despesas com Pessoal",            accountCodes: ["3.2.3"],                    operation: "subtract",   displayOrder: 7 },
  { dreLineId: "despesas_comerciais",     dreLineName: "(-) Despesas Comerciais",             accountCodes: ["3.2.5"],                    operation: "subtract",   displayOrder: 8 },
  { dreLineId: "outras_despesas",         dreLineName: "(-) Outras Despesas",                 accountCodes: ["3.2.6"],                    operation: "subtract",   displayOrder: 9 },
  { dreLineId: "resultado_operacional",   dreLineName: "= RESULTADO OPERACIONAL",             accountCodes: [],                           operation: "calculated", displayOrder: 10 },
  { dreLineId: "receitas_financeiras",    dreLineName: "(+) Receitas Financeiras",            accountCodes: ["3.1.2"],                    operation: "sum",        displayOrder: 11 },
  { dreLineId: "despesas_financeiras",    dreLineName: "(-) Despesas Financeiras",            accountCodes: ["3.2.4"],                    operation: "subtract",   displayOrder: 12 },
  { dreLineId: "outras_receitas",         dreLineName: "(+) Outras Receitas",                 accountCodes: ["3.1.3"],                    operation: "sum",        displayOrder: 13 },
  { dreLineId: "resultado_antes_ir",      dreLineName: "= RESULTADO ANTES DO IR/CS",          accountCodes: [],                           operation: "calculated", displayOrder: 14 },
  { dreLineId: "resultado_liquido",       dreLineName: "= RESULTADO LÍQUIDO DO EXERCÍCIO",    accountCodes: [],                           operation: "calculated", displayOrder: 15 },
];
