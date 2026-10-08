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
 * Contas específicas para Infoprodutores / Produtores Digitais
 */
const infoprodutorExtras: TemplateAccount[] = [
  // ── Receitas Digitais ────────────────────────────────
  a("3.1.1.20", "Receita de Cursos Online",         "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.21", "Receita de Mentorias",             "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.22", "Receita de E-books e Materiais",   "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.23", "Receita de Assinaturas/Memberships","receita","credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.24", "Receita de Afiliados",             "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),
  a("3.1.1.25", "Receita de Palestras e Workshops", "receita", "credora", 4, "3.1.1", true, "Receita Bruta"),

  // ── Deduções Específicas ─────────────────────────────
  a("3.1.1.30", "(-) Taxas de Plataforma (Hotmart, Eduzz)", "receita", "devedora", 4, "3.1.1", true, "Deduções"),
  a("3.1.1.31", "(-) Comissões de Afiliados",               "receita", "devedora", 4, "3.1.1", true, "Deduções"),
  a("3.1.1.32", "(-) Reembolsos e Chargebacks",             "receita", "devedora", 4, "3.1.1", true, "Deduções"),

  // ── Custos de Produção Digital ───────────────────────
  a("3.2.1.20", "Produção de Conteúdo",             "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.21", "Edição de Vídeo",                  "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.22", "Design e Identidade Visual",       "custo", "devedora", 4, "3.2.1", true, "Custos"),
  a("3.2.1.23", "Plataformas de Hospedagem (Hotmart, Kiwify)", "custo", "devedora", 4, "3.2.1", true, "Custos"),

  // ── Despesas de Marketing Digital ────────────────────
  a("3.2.5.20", "Tráfego Pago (Meta Ads, Google Ads)", "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.21", "Copywriter / Redator",                 "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.22", "Social Media / Community Manager",     "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),
  a("3.2.5.23", "Influenciadores e Parcerias",          "despesa", "devedora", 4, "3.2.5", true, "Despesas Comerciais"),

  // ── Despesas Operacionais Específicas ────────────────
  a("3.2.2.20", "Equipamentos de Gravação/Estúdio", "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
  a("3.2.2.21", "Ferramentas de Automação (ActiveCampaign, RD)", "despesa", "devedora", 4, "3.2.2", true, "Despesas Administrativas"),
];

export const infoprodutorAccounts: TemplateAccount[] = [...baseAccounts, ...infoprodutorExtras];

export const infoprodutorDREMapping: TemplateDREMapping[] = baseDREMapping;
