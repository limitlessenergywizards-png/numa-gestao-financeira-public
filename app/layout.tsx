import type { Metadata, Viewport } from 'next';
import type { Session } from '@supabase/supabase-js';
import { Syne, Manrope } from 'next/font/google';
import '../src/index.css';
import { Providers } from './providers';

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

export const metadata: Metadata = {
  title: {
    default: 'Numa Gestao Financeira',
    template: '%s | Numa',
  },
  description: 'Sistema de gestao financeira para pequenos negocios',
  manifest: '/manifest.json',
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
        <Providers initialSession={initialSession}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
