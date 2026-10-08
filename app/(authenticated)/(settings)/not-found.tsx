import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-2">Página de configuração não encontrada</h2>
          <p className="text-sm text-muted-foreground mb-6">
            A página de configuração que você está procurando não existe.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/configuracoes"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Voltar às configurações
          </Link>
          <Link
            href="/inicio"
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium"
          >
            Ir para Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
