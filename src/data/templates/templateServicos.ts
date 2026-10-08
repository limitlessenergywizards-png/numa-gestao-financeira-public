import type { TemplateAccount, TemplateDREMapping } from "./types";
import { baseAccounts, baseDREMapping } from "./templateBase";

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
 * Contas específicas para empresas de Serviços / Consultoria
 */
const servicosExtras: TemplateAccount[] = [
  // ── Receitas de Serviços ─────────────────────────────
  a("3.1.1.10", "Receita de Consultoria",          "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.11", "Receita de Projetos",             "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.12", "Receita de Manutenção/Suporte",   "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.13", "Receita de Treinamentos",         "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.14", "Comissões Recebidas",             "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),

  // ── Custos dos Serviços ──────────────────────────────
  a("3.2.1.10", "Custos com Pessoal Técnico",      "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.11", "Freelancers e Terceirizados",     "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.12", "Ferramentas e Licenças de Projeto","custo","devedora", 4, "3.2.1", true, "Custos"),

  // ── Despesas Comerciais Específicas ──────────────────
  a("3.2.5.10", "Marketing e Prospecção",           "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.11", "Networking e Eventos",             "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.12", "Viagens Comerciais",               "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
];

export const servicosAccounts: TemplateAccount[] = [...baseAccounts, ...servicosExtras];

export const servicosDREMapping: TemplateDREMapping[] = baseDREMapping;
