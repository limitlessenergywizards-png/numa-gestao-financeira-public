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
    console.error('[PublicRouteError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3B34] p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <AlertTriangle className="h-10 w-10 text-[#C5A059]" />
        <h2 className="text-lg font-semibold text-[#E5E5E5]">Algo deu errado</h2>
        <p className="text-sm text-[#E5E5E5]/60">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <Button
          onClick={reset}
          className="bg-[#C5A059] text-[#1B3B34] hover:bg-[#D4B87A]"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
