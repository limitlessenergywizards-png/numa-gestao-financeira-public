import { ImageResponse } from 'next/og';

// Runtime: Node.js (default). Edge seria mais rápido mas quebra o build mobile
// via Capacitor (NEXT_STATIC_EXPORT=true não suporta edge functions).
// Node runtime mantém compatibilidade com ambos os builds (T18 do context/01).

// dynamic = 'force-static' é obrigatório para o build mobile (output: 'export')
// não falhar ao coletar page data dessa rota.
export const dynamic = 'force-static';

export const alt =
  'Numa — gestão financeira para contadores e profissionais liberais brasileiros';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0F201D 0%, #1B3B34 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#1B3B34',
              border: '2px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            N
          </div>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Numa
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '64px',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              maxWidth: '960px',
              margin: 0,
            }}
          >
            Gestão financeira para contadores e profissionais liberais
          </h1>
          <p
            style={{
              color: '#C0C0C0',
              fontSize: '28px',
              fontWeight: 400,
              margin: 0,
            }}
          >
            R$ 197/mês · Trial de 3 dias sem cartão · Sem fidelidade
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
