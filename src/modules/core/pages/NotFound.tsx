'use client';

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_ROUTES, MAIN_ROUTES } from "@/lib/routes";
import { useAuthState } from "@/contexts/AuthContext";

const NotFound = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthState();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error("[404] Rota não encontrada:", pathname);
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full space-y-6 animate-fade-in">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link href={user ? MAIN_ROUTES.HOME : PUBLIC_ROUTES.LANDING}>
              <Home className="h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à página anterior
          </Button>
        </div>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border text-left">
            <p className="text-xs font-mono text-muted-foreground mb-2">
              Informações de debug (apenas em desenvolvimento):
            </p>
            <div className="text-xs font-mono text-muted-foreground space-y-1">
              <p>
                <span className="text-foreground">Path:</span> {pathname}
              </p>
              {searchParams.toString() && (
                <p>
                  <span className="text-foreground">Query:</span> ?{searchParams.toString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
