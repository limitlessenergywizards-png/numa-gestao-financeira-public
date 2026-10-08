/**
 * Helpers tipados para os eventos SEO críticos.
 *
 * Disparam via posthog client global se inicializado (PostHogProvider).
 * No-op silencioso se PostHog não estiver carregado (dev local sem
 * credenciais ou falha de network).
 *
 * Lista de eventos por context/06 seção 10 e prompt 05:
 * - cta_trial_clicked
 * - cta_comparativo_clicked
 * - faq_expanded
 * - calculator_started / calculator_completed
 * - scroll_depth
 */

import posthog from 'posthog-js';

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined') return;
    if (!posthog.__loaded) return;
    posthog.capture(event, properties);
  } catch {
    // silencioso — analytics nunca quebra UX
  }
}

export type CtaLocation =
  | 'header'
  | 'hero_home'
  | 'hero_precos'
  | 'hero_para_contadores'
  | 'hero_para_bpo'
  | 'hero_profissao'
  | 'hero_alternativa'
  | 'hero_reforma'
  | 'footer'
  | 'mid_content'
  | 'cta_block';

export function ctaTrialClicked(location: CtaLocation) {
  safeCapture('cta_trial_clicked', { location });
}

export function ctaComparativoClicked(concorrente: string) {
  safeCapture('cta_comparativo_clicked', { concorrente });
}

export function faqExpanded(question: string, page: string) {
  safeCapture('faq_expanded', { question, page });
}

export function calculatorStarted() {
  safeCapture('calculator_started');
}

export interface CalculatorResult {
  regime: string;
  faturamentoAnual: number;
  cargaTributariaAtual: number;
  cargaTributariaPosReforma: number;
  delta: number;
}

export function calculatorCompleted(result: CalculatorResult) {
  safeCapture('calculator_completed', { ...result });
}

export function scrollDepth(page: string, depth: 25 | 50 | 75 | 100) {
  safeCapture('scroll_depth', { page, depth });
}
