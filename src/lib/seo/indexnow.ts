/**
 * IndexNow client helper.
 *
 * IndexNow é um protocolo (Bing, Yandex, Seznam, suportado por Google em
 * roadmap) que notifica search engines imediatamente quando uma URL nova
 * ou atualizada é publicada — substitui o ciclo de re-crawl convencional.
 *
 * Uso: chamar `pingIndexNow([urls])` quando publicar páginas novas
 * (após mês 2+, conforme runbook). No-op se `NEXT_PUBLIC_INDEXNOW_KEY`
 * não estiver setada.
 *
 * Pré-requisito de propriedade: existir `public/[KEY].txt` com a key
 * como conteúdo (Bing valida via GET).
 *
 * Docs: https://www.indexnow.org/documentation
 */

const HOST = 'numagestaofinanceira.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowResult {
  status: 'skipped' | 'ok' | 'error';
  httpStatus?: number;
  message?: string;
}

export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.NEXT_PUBLIC_INDEXNOW_KEY;

  if (!key) {
    return { status: 'skipped', message: 'NEXT_PUBLIC_INDEXNOW_KEY ausente' };
  }
  if (!urls.length) {
    return { status: 'skipped', message: 'urls vazia' };
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `https://${HOST}/${key}.txt`,
        urlList: urls,
      }),
    });

    if (!response.ok) {
      console.warn('[indexnow] non-ok status', response.status);
      return { status: 'error', httpStatus: response.status };
    }

    return { status: 'ok', httpStatus: response.status };
  } catch (err) {
    // Nunca quebra o fluxo do caller. Apenas loga.
    console.warn('[indexnow] fetch failed', err);
    return {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
