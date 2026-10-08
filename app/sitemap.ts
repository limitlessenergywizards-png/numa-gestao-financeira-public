import type { MetadataRoute } from 'next';

// Necessario para o build mobile (NEXT_STATIC_EXPORT=true) gerar
// /sitemap.xml como arquivo estatico. T18 do context/01.
export const dynamic = 'force-static';

const SITE_URL = 'https://numagestaofinanceira.com';

type Entry = {
  path: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
};

const core: Entry[] = [
  { path: '', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/precos', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/para-contadores', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/para-bpo-financeiro', changeFrequency: 'monthly', priority: 0.8 },
];

const profissoes: Entry[] = (
  ['/para-medicos', '/para-dentistas', '/para-nutricionistas', '/para-psicologos', '/para-advogados'] as const
).map((path) => ({ path, changeFrequency: 'monthly', priority: 0.7 }));

const competidores: Entry[] = (
  [
    '/alternativa-xfin',
    '/xfin-vs-numa',
    '/migrar-do-xfin',
    '/alternativa-nibo',
    '/alternativa-contaazul',
    '/alternativa-omie',
  ] as const
).map((path) => ({ path, changeFrequency: 'monthly', priority: 0.8 }));

const reformaPilar: Entry[] = [
  { path: '/reforma-tributaria', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/reforma-tributaria/calculadora-impacto', changeFrequency: 'weekly', priority: 0.9 },
];

const reformaSub: Entry[] = (
  [
    '/reforma-tributaria/cbs-ibs-2026',
    '/reforma-tributaria/cronograma',
    '/reforma-tributaria/nfse',
    '/reforma-tributaria/profissional-liberal',
    '/reforma-tributaria/contador-como-se-preparar',
  ] as const
).map((path) => ({ path, changeFrequency: 'weekly', priority: 0.8 }));

const legais: Entry[] = (['/termos', '/privacidade'] as const).map((path) => ({
  path,
  changeFrequency: 'yearly',
  priority: 0.3,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const all = [...core, ...profissoes, ...competidores, ...reformaPilar, ...reformaSub, ...legais];

  return all.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
