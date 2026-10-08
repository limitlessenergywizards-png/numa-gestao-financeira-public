import type { MetadataRoute } from 'next';

// Necessario para o build mobile (NEXT_STATIC_EXPORT=true) gerar
// /manifest.webmanifest como arquivo estatico. T18 do context/01.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Numa · Gestão financeira',
    short_name: 'Numa',
    description:
      'Gestão financeira para contadores e profissionais liberais brasileiros',
    start_url: '/',
    display: 'standalone',
    background_color: '#1B3B34',
    theme_color: '#1B3B34',
    lang: 'pt-BR',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/favicon.ico?v=3',
        sizes: '64x64 32x32 16x16',
        type: 'image/x-icon',
      },
      {
        src: '/icons/icon-192.png?v=3',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png?v=3',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
