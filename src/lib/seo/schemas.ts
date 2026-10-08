/**
 * Schemas JSON-LD reutilizaveis para SEO publico da Numa.
 *
 * Convencoes:
 * - URLs absolutas (https://numagestaofinanceira.com/...)
 * - @id estaveis para cross-referencia entre schemas via { "@id": ... }
 * - NUNCA inclua aggregateRating sem reviews publicas verificaveis (manual
 *   action garantida do Google). Aguarde G2/Capterra/Trustpilot existentes
 * - Datas em ISO 8601 quando aplicavel
 */

export const SITE_URL = 'https://numagestaofinanceira.com';

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Numa',
  alternateName: 'Numa Gestão Financeira',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/numa-logo.png`,
    width: 1280,
    height: 853,
  },
  description:
    'Software de gestão financeira para contadores de BPO e profissionais liberais brasileiros.',
  foundingDate: '2025',
  founder: [
    {
      '@type': 'Person',
      name: 'Thierre Sávio Francelino de Oliveira',
    },
    {
      '@type': 'Person',
      name: 'Cassiano Mendes',
    },
  ],
  parentOrganization: {
    '@type': 'Organization',
    name: 'Būma · Intelligent Software Architecture',
    url: 'https://buma.app',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Fortaleza',
    addressRegion: 'CE',
    addressCountry: 'BR',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'suporte@numagestaofinanceira.com',
      areaServed: 'BR',
      availableLanguage: ['Portuguese'],
    },
    {
      '@type': 'ContactPoint',
      contactType: 'privacy',
      email: 'privacidade@numagestaofinanceira.com',
      areaServed: 'BR',
    },
  ],
  sameAs: [
    'https://www.linkedin.com/company/numa-gestao-financeira',
    'https://www.instagram.com/numa.app',
  ],
} as const;

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: 'Numa',
  description:
    'Gestão financeira para contadores e profissionais liberais brasileiros.',
  publisher: { '@id': ORG_ID },
  inLanguage: 'pt-BR',
  // potentialAction SearchAction: omitido até existir /buscar funcional.
  // Schema sem search > schema apontando para 404.
} as const;

/**
 * SoftwareApplication: usado apenas em /precos (prompt 09) e na home
 * (prompt 08). NÃO global. Importar pontualmente.
 *
 * featureList contém apenas features REAIS em produção. NFS-e (eNotas),
 * Open Finance e WhatsApp support estão fora até estarem em produção.
 */
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': SOFTWARE_ID,
  name: 'Numa',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description:
    'Software de gestão financeira para contadores de BPO financeiro e profissionais liberais. Trial gratuito de 3 dias.',
  inLanguage: 'pt-BR',
  offers: {
    '@type': 'Offer',
    price: '197.00',
    priceCurrency: 'BRL',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '197.00',
      priceCurrency: 'BRL',
      billingDuration: 'P1M',
      unitText: 'MONTH',
    },
    url: `${SITE_URL}/precos`,
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    'Multi-cliente para BPO financeiro',
    'Conciliação bancária',
    'DRE gerencial',
    'Fluxo de caixa projetado',
    'Contas a pagar e receber',
    'OCR de notas fiscais',
    'CNPJs ilimitados',
  ],
  creator: { '@id': ORG_ID },
} as const;
