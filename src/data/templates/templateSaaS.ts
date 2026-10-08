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
 * Contas específicas para empresas SaaS (Software as a Service)
 */
const saasExtras: TemplateAccount[] = [
  // ── Receitas SaaS ───────────────────────────────────
  a("3.1.1.30", "Receita de Assinaturas (MRR)",     "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.31", "Receita de Setup/Implantação",     "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.32", "Receita de Suporte Premium",       "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.33", "Receita de Customizações",         "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.34", "Receita de Treinamentos",          "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.35", "Receita de APIs e Integrações",    "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),

  // ── Deduções SaaS ───────────────────────────────────
  a("3.1.1.40", "(-) Churn / Cancelamentos",        "receita", "devedora", 4, "3.1.1", true, "Deduções"),
  a("3.1.1.41", "(-) Descontos e Cupons",           "receita", "devedora", 4, "3.1.1", true, "Deduções"),

  // ── Custos de Infraestrutura ─────────────────────────
  a("3.2.1.30", "Infraestrutura Cloud (AWS, GCP, Azure)", "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.31", "Desenvolvedores e Engenharia",           "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.32", "Suporte Técnico / CS",                   "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.33", "APIs e Serviços de Terceiros",           "custo", "devedora", 4, "3.2.1", true, "Custos"),

  // ── Despesas Comerciais SaaS ─────────────────────────
  a("3.2.5.30", "Marketing Digital (Inbound/Outbound)", "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.31", "Customer Success",                      "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.32", "Vendas SDR/AE",                         "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.33", "Parcerias e Integrações",                "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),

  // ── Despesas Operacionais SaaS ───────────────────────
  a("3.2.2.30", "P&D e Inovação",                   "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.31", "Ferramentas de Desenvolvimento",   "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.32", "Segurança e Compliance",            "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
];

export const saasAccounts: TemplateAccount[] = [...baseAccounts, ...saasExtras];

export const saasDREMapping: TemplateDREMapping[] = baseDREMapping;
