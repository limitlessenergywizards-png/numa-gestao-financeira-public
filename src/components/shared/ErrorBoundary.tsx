'use client';

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canSafelyReload, recordReload, isProtectionDisabled } from "@/lib/reloadProtection";
import { PUBLIC_ROUTES } from "@/lib/routes";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "page" | "section" | "component";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    console.error("[ErrorBoundary]", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level || "component",
    });

    // Auto-reload on chunk loading failures (happens after deployment with new chunks)
    if (this.isChunkLoadError(error)) {
      // Use sessionStorage to prevent infinite reload loops
      const reloadKey = 'chunk_reload_' + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      const RELOAD_DEBOUNCE_MS = 60000; // Increased from 10s to 60s

      // Check if we haven't reloaded recently (path-specific debounce)
      const canReloadPathSpecific = !lastReload || (now - parseInt(lastReload)) > RELOAD_DEBOUNCE_MS;

      if (canReloadPathSpecific) {
        // Check global reload protection
        const reason = `chunk_error_boundary_${window.location.pathname}`;

        if (!isProtectionDisabled() && !canSafelyReload(reason)) {
          console.error(
            '[ErrorBoundary] Auto-reload blocked by reload protection.',
            'Too many reloads detected. Please reload manually or contact support.'
          );
          // Don't auto-reload, let error UI show instead
          this.props.onError?.(error, errorInfo);
          return;
        }

        // Safe to reload - record and execute
        sessionStorage.setItem(reloadKey, now.toString());
        recordReload(reason);

        console.warn(
          '[ErrorBoundary] Chunk load error detected, reloading page...',
          `Path: ${window.location.pathname}`
        );

        window.location.reload();
        return;
      } else {
        console.error(
          '[ErrorBoundary] Chunk load error, but reload debounce active.',
          `Last reload: ${(now - parseInt(lastReload)) / 1000}s ago`
        );
      }
    }

    this.props.onError?.(error, errorInfo);
  }

  isChunkLoadError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('dynamically imported module')
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = PUBLIC_ROUTES.LANDING;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = "component" } = this.props;

      // Full page error
      if (level === "page") {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="text-center max-w-md w-full space-y-6 animate-fade-in">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Algo deu errado
                </h1>
                <p className="text-muted-foreground">
                  Ocorreu um erro inesperado. Nossa equipe foi notificada.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recarregar página
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Voltar ao início
                </Button>
              </div>

              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border text-left overflow-auto max-h-64">
                  <p className="text-xs font-mono text-destructive mb-2 font-semibold">
                    {this.state.error.message}
                  </p>
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Section error
      if (level === "section") {
        return (
          <div className="flex items-center justify-center p-8 rounded-lg bg-muted/30 border border-border">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Erro ao carregar esta seção
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente recarregar ou volte mais tarde.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Tentar novamente
              </Button>
            </div>
          </div>
        );
      }

      // Component error (smallest)
      return (
        <div className="p-4 rounded-md bg-destructive/5 border border-destructive/20 text-center">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar este componente.{" "}
            <button
              onClick={this.handleRetry}
              className="text-primary underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
export { ErrorBoundary };
