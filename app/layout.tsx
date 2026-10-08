import type { Metadata, Viewport } from 'next';
import type { Session } from '@supabase/supabase-js';
import { Syne, Manrope } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '../src/index.css';
import { Providers } from './providers';
import { JsonLd } from '@/lib/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/seo/schemas';
import { PostHogProvider } from '@/lib/seo/posthog/PostHogProvider';
import { PostHogPageView } from '@/lib/seo/posthog/PostHogPageView';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const SITE_URL = 'https://numagestaofinanceira.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Numa — Gestão financeira para contadores brasileiros',
    template: '%s | Numa',
  },
  description:
    'Financeiro descomplicado. Sem retrabalho. Plataforma brasileira de gestão financeira para contadores e profissionais liberais. CNPJ e usuários ilimitados.',
  applicationName: 'Numa',
  authors: [{ name: 'Numa', url: SITE_URL }],
  creator: 'Numa',
  publisher: 'L Energy Wizards LTDA',
  generator: 'Next.js',
  keywords: [
    'gestão financeira',
    'BPO financeiro',
    'software para contadores',
    'DRE gerencial',
    'NFS-e',
    'fluxo de caixa',
    'contas a pagar e receber',
    'gestão financeira para profissionais liberais',
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: '32x32' },
      { url: '/favicon.png?v=3', type: 'image/png', sizes: '180x180' },
    ],
    apple: '/icons/apple-touch-icon.png?v=3',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Numa',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'Numa',
    title: 'Numa — Gestão financeira para contadores brasileiros',
    description:
      'Financeiro descomplicado. Sem retrabalho. Gestão financeira para contadores e profissionais liberais.',
    // images: gerenciado por app/opengraph-image.tsx (file convention)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Numa — Gestão financeira para contadores brasileiros',
    description:
      'Financeiro descomplicado. Sem retrabalho. Plataforma brasileira para contadores e profissionais liberais.',
    // images: fallback para opengraph-image.tsx (Next.js usa OG image se twitter-image nao existir)
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || 'PENDING_TOKEN',
    other: {
      'msvalidate.01':
        process.env.BING_SITE_VERIFICATION || 'PENDING_TOKEN',
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/',
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

async function getServerSession(): Promise<Session | null> {
  if (isStaticExport) return null;
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSession = await getServerSession();

  return (
    <html lang="pt-BR" className={`${syne.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased">
        <PostHogProvider>
          <Providers initialSession={initialSession}>
            {children}
          </Providers>
          <PostHogPageView />
        </PostHogProvider>
        <SpeedInsights />
        <JsonLd data={[organizationSchema, websiteSchema]} id="ld-org-website" />
      </body>
    </html>
  );
}
