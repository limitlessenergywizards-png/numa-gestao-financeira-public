'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <AlertTriangle style={{ width: 40, height: 40, color: '#ef4444', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
          Algo deu errado
        </h2>
        <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '16px' }}>
          Ocorreu um erro inesperado na aplicação.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            background: '#C5A059',
            color: '#1B3B34',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
