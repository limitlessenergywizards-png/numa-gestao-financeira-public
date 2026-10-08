import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3B34] p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-[#C5A059]" />
        <div>
          <h1 className="text-3xl font-bold text-[#E5E5E5] mb-2">404</h1>
          <h2 className="text-xl font-semibold text-[#E5E5E5] mb-2">Página não encontrada</h2>
          <p className="text-sm text-[#E5E5E5]/60 mb-6">
            A página que você está procurando não existe ou foi removida.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/auth"
            className="px-4 py-2 bg-[#C5A059] text-[#1B3B34] rounded-md hover:bg-[#D4B87A] transition-colors text-sm font-medium font-semibold"
          >
            Voltar ao login
          </Link>
          <Link
            href="/"
            className="px-4 py-2 border border-[#C5A059]/30 text-[#E5E5E5] rounded-md hover:bg-[#C5A059]/10 transition-colors text-sm font-medium"
          >
            Ir para início
          </Link>
        </div>
      </div>
    </div>
  );
}
