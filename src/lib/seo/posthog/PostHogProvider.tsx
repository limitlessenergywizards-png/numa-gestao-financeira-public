'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/**
 * Initializes PostHog client uma única vez no browser.
 *
 * Configurações por A0/T6 do context/01:
 * - api_host: '/ingest' (reverse proxy em next.config.ts evita ad-blockers)
 * - ui_host: https://eu.posthog.com (links do PostHog → EU)
 * - person_profiles: 'identified_only' (privacy/cost — sem person para anônimos)
 * - capture_pageview: false (capturado manualmente em PostHogPageView para SPA nav)
 * - capture_pageleave: true
 * - autocapture: limitado a a/button/form
 *
 * Se env vars estiverem ausentes (dev local sem credenciais), no-op silencioso.
 * Produção via Vercel deve ter as vars setadas.
 */
function PostHogClientInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!POSTHOG_KEY) return;
    if (posthog.__loaded) return;

    posthog.init(POSTHOG_KEY, {
      api_host: '/ingest',
      ui_host: 'https://eu.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit'],
        element_allowlist: ['a', 'button', 'form'],
      },
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug(false);
      },
    });
  }, []);
  return null;
}

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  return (
    <PostHogReactProvider client={posthog}>
      <PostHogClientInit />
      {children}
    </PostHogReactProvider>
  );
}
