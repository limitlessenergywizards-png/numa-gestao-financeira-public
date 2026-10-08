import type { MetadataRoute } from 'next';

// Necessario para o build mobile (NEXT_STATIC_EXPORT=true) gerar
// /robots.txt como arquivo estatico. T18 do context/01.
export const dynamic = 'force-static';

const SITE_URL = 'https://numagestaofinanceira.com';

const DISALLOW = [
  '/api/',
  '/admin/',
  '/dashboard/',
  '/inicio/',
  '/configuracoes/',
  '/perfil/',
  '/auth/',
  '/aceitar-convite/',
  '/ativar-conta/',
  '/esqueci-senha/',
  '/redefinir-senha/',
  '/plano-expirado/',
  '/pagamento/',
  '/onboarding/',
  '/clear-cache/',
  '/_next/',
];

const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Bingbot',
  'CCBot',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  const rules = [
    { userAgent: '*', allow: '/', disallow: DISALLOW },
    ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
  ];

  return {
    rules,
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
