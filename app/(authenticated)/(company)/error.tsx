'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CompanyRouteError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex gap-3">
          <Button onClick={reset} variant="default">
            Tentar novamente
          </Button>
          <Button onClick={() => window.location.href = '/inicio'} variant="outline">
            Ir para início
          </Button>
        </div>
      </div>
    </div>
  );
}
