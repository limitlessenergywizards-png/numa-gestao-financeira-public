import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['45.55.83.75'],

  // Dual-build: SSR for Vercel (default), static export for Capacitor mobile
  ...(isStaticExport && {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  }),

  typescript: {
    ignoreBuildErrors: false,
  },

  compress: true,

  // PostHog reverse proxy: evita bloqueio por ad-blockers. Browser
  // chama /ingest/* (same-origin) e Next.js encaminha para eu.i.posthog.com.
  // skipTrailingSlashRedirect evita trailing-slash quebrar o proxy.
  // No build mobile (output: 'export') rewrites nao se aplicam — analytics
  // SEO so funciona em web/Vercel (T18 do context/01).
  skipTrailingSlashRedirect: true,

  // Image optimization (SSR mode only — static export uses unoptimized above)
  ...(!isStaticExport && {
    images: {
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    },
  }),

  experimental: {
    // Tree-shake barrel imports for heavy packages
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'react-hook-form',
      'zod',
      'cmdk',
      'sonner',
      'class-variance-authority',
      'tesseract.js',
      'jspdf',
      'jspdf-autotable',
    ],
  },

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},

  // Webpack fallback for static export / legacy builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },

  // PostHog reverse proxy rewrites (SSR mode only — static export ignora rewrites).
  async rewrites() {
    if (isStaticExport) return [];

    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },

  // Legacy route redirects (SSR mode only — ignored in static export)
  async redirects() {
    if (isStaticExport) return [];

    return [
      // Finance legacy routes
      { source: '/movimentacoes', destination: '/financeiro/transacoes', permanent: true },
      { source: '/contas-receber', destination: '/financeiro/contas-receber', permanent: true },
      { source: '/contas-pagar', destination: '/financeiro/contas-pagar', permanent: true },
      { source: '/relatorios/fluxo-caixa', destination: '/financeiro/fluxo-caixa', permanent: true },
      { source: '/relatorios/dre', destination: '/financeiro/dre', permanent: true },
      { source: '/reconciliacao', destination: '/financeiro/reconciliacao', permanent: true },
      { source: '/saude-financeira', destination: '/financeiro/saude-financeira', permanent: true },
      { source: '/dividas', destination: '/financeiro/dividas', permanent: true },
      { source: '/relatorios/avancados', destination: '/analise/relatorios', permanent: true },
      // Registration legacy routes
      { source: '/cadastros/clientes', destination: '/crm/clientes', permanent: true },
      { source: '/cadastros/fornecedores', destination: '/crm/fornecedores', permanent: true },
      { source: '/cadastros/contas-bancarias', destination: '/financeiro/contas-bancarias', permanent: true },
      { source: '/cadastros/plano-contas', destination: '/financeiro/plano-contas', permanent: true },
      { source: '/cadastros/centros-custo', destination: '/financeiro/centros-custo', permanent: true },
      { source: '/cadastros/categorias', destination: '/financeiro/categorias', permanent: true },
    ];
  },

  // Security + caching headers (SSR mode only)
  async headers() {
    if (isStaticExport) return [];

    return [
      // Service Worker — never cache (must check for updates on every navigation)
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // Fonts — immutable cache
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Icons and images — long cache with revalidation
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // Security headers — all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://brasilapi.com.br https://viacep.com.br https://*.vercel.app https://vercel.live; frame-src https://js.stripe.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
