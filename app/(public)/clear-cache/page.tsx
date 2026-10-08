'use client';

import { useState } from 'react';

export default function ClearCachePage() {
  const [status, setStatus] = useState<'idle' | 'clearing' | 'done' | 'error'>('idle');
  const [details, setDetails] = useState<string[]>([]);

  async function handleClear() {
    setStatus('clearing');
    const log: string[] = [];

    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          log.push(`SW removido: ${reg.scope}`);
        }
        if (registrations.length === 0) {
          log.push('Nenhum Service Worker encontrado');
        }
      }

      // 2. Delete all caches
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
          log.push(`Cache deletado: ${name}`);
        }
        if (names.length === 0) {
          log.push('Nenhum cache encontrado');
        }
      }

      log.push('Limpeza concluida! Recarregando em 2s...');
      setDetails(log);
      setStatus('done');

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      log.push(`Erro: ${err instanceof Error ? err.message : String(err)}`);
      setDetails(log);
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3B34] p-4">
      <div className="max-w-md w-full bg-[#1B3B34] border border-[#C5A059]/20 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-[#E5E5E5] mb-2">
          Limpar Cache
        </h1>
        <p className="text-sm text-[#E5E5E5]/60 mb-6">
          Remove Service Workers e caches antigos para garantir que voce esta usando a versao mais recente do Numa.
        </p>

        {status === 'idle' && (
          <button
            onClick={handleClear}
            className="w-full py-3 px-6 bg-[#C5A059] text-[#1B3B34] font-semibold rounded-lg hover:bg-[#C5A059]/90 transition-colors"
          >
            Limpar tudo e recarregar
          </button>
        )}

        {status === 'clearing' && (
          <div className="text-[#C5A059] animate-pulse">Limpando...</div>
        )}

        {details.length > 0 && (
          <div className="mt-6 text-left bg-black/20 rounded-lg p-4">
            {details.map((d, i) => (
              <div key={i} className="text-xs text-[#E5E5E5]/70 font-mono py-0.5">
                {d}
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-[#C5A059] underline"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
