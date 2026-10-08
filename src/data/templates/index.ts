import type { TemplateDefinition } from "./types";
import { baseAccounts, baseDREMapping } from "./templateBase";
import { servicosAccounts, servicosDREMapping } from "./templateServicos";
import { infoprodutorAccounts, infoprodutorDREMapping } from "./templateInfoprodutor";
import { saasAccounts, saasDREMapping } from "./templateSaaS";

export type { TemplateAccount, TemplateDREMapping, TemplateDefinition, AccountEntryType, AccountNature } from "./types";

/**
 * Registry de todos os templates disponíveis.
 * O `key` é usado como identificador estável para o seed.
 */
export const TEMPLATES: Record<string, TemplateDefinition> = {
  padrao: {
    name: "Padrão Simplificado",
    description: "Plano de contas completo com Balanço Patrimonial e DRE — ideal para a maioria das empresas",
    segment: "geral",
    isDefault: true,
    accounts: baseAccounts,
    dreMapping: baseDREMapping,
  },
  servicos: {
    name: "Serviços e Consultoria",
    description: "Contas para consultorias, agências, escritórios e prestadores de serviço",
    segment: "servicos",
    isDefault: false,
    accounts: servicosAccounts,
    dreMapping: servicosDREMapping,
  },
  infoprodutor: {
    name: "Infoprodutor / Digital",
    description: "Cursos online, mentorias, e-books, assinaturas e marketing digital",
    segment: "infoprodutor",
    isDefault: false,
    accounts: infoprodutorAccounts,
    dreMapping: infoprodutorDREMapping,
  },
  saas: {
    name: "SaaS / Software",
    description: "Assinaturas MRR, infraestrutura cloud, CS, SDR e métricas SaaS",
    segment: "saas",
    isDefault: false,
    accounts: saasAccounts,
    dreMapping: saasDREMapping,
  },
};

/** Lista de keys dos templates para iteração */
export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[];

/** Retorna a definição do template pelo key */
export function getTemplate(key: string): TemplateDefinition | undefined {
  return TEMPLATES[key];
}

/** Retorna o template padrão */
export function getDefaultTemplate(): TemplateDefinition {
  return TEMPLATES.padrao;
}
