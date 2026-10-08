'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { canSafelyReload, recordReload, isProtectionDisabled } from '@/lib/reloadProtection';
import { PUBLIC_ROUTES } from '@/lib/routes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_RETRIES = 2; // Reduced from 3 - after 2 auto-retries, show manual UI
const RETRY_KEY = 'lazy-load-retry-count';
const RETRY_DEBOUNCE_KEY = 'lazy-load-retry-timestamp';
const FIRST_RETRY_DELAY = 5000; // 5 seconds for first retry (could be temporary network)
const SECOND_RETRY_DELAY = 60000; // 60 seconds for second retry

/**
 * Error Boundary specifically for lazy-loaded components
 * Handles chunk loading failures with automatic retry and loop protection
 */
export class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: this.getStoredRetryCount(),
    };
  }

  private getStoredRetryCount(): number {
    try {
      const count = sessionStorage.getItem(RETRY_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  private setStoredRetryCount(count: number): void {
    try {
      sessionStorage.setItem(RETRY_KEY, count.toString());
    } catch {
      // Ignore storage errors
    }
  }

  private canAutoRetry(): boolean {
    try {
      const lastRetry = sessionStorage.getItem(RETRY_DEBOUNCE_KEY);
      if (!lastRetry) return true;

      const { retryCount } = this.state;
      // Use different delays based on retry count
      const requiredDelay = retryCount === 0 ? FIRST_RETRY_DELAY : SECOND_RETRY_DELAY;

      const elapsed = Date.now() - parseInt(lastRetry, 10);
      return elapsed > requiredDelay;
    } catch {
      return false;
    }
  }

  private markRetryAttempt(): void {
    try {
      sessionStorage.setItem(RETRY_DEBOUNCE_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }

  private clearRetryState(): void {
    try {
      sessionStorage.removeItem(RETRY_KEY);
      sessionStorage.removeItem(RETRY_DEBOUNCE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private isChunkLoadError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('dynamically imported module') ||
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      error.name === 'ChunkLoadError'
    );
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    // Only auto-retry for chunk loading errors
    if (this.isChunkLoadError(error)) {
      const { retryCount } = this.state;

      // Check if we should attempt auto-retry
      if (retryCount < MAX_RETRIES && this.canAutoRetry()) {
        // Check global reload protection
        const reason = `chunk_error_lazy_${retryCount + 1}`;

        if (!isProtectionDisabled() && !canSafelyReload(reason)) {
          console.error(
            '[LazyLoadErrorBoundary] Auto-reload blocked by reload protection.',
            'Too many reloads detected. Please reload manually.'
          );
          // Don't auto-reload, show manual UI instead
          return;
        }

        this.setStoredRetryCount(retryCount + 1);
        this.markRetryAttempt();

        const delay = retryCount === 0 ? FIRST_RETRY_DELAY : SECOND_RETRY_DELAY;

        console.warn(
          `[LazyLoadErrorBoundary] Chunk load failed, retrying in ${delay / 1000}s (${retryCount + 1}/${MAX_RETRIES})...`
        );

        // Record the reload before it happens
        recordReload(reason);

        // Delay before reload to avoid rapid reloads
        setTimeout(() => {
          window.location.reload();
        }, delay);

        return;
      }

      // Max retries reached or debounce not satisfied
      console.error(
        '[LazyLoadErrorBoundary] Max retries reached or debounce active. Showing error UI.',
        `Retry count: ${retryCount}/${MAX_RETRIES}`
      );
    }

    console.error('[LazyLoadErrorBoundary] Error caught:', error);
  }

  handleManualRetry = (): void => {
    this.clearRetryState();
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.clearRetryState();
    window.location.href = PUBLIC_ROUTES.LANDING;
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError = this.state.error && this.isChunkLoadError(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {isChunkError ? 'Erro ao carregar a página' : 'Algo deu errado'}
              </h1>
              <p className="text-muted-foreground">
                {isChunkError
                  ? 'Houve um problema ao carregar os recursos da página. Isso pode acontecer após uma atualização.'
                  : 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleManualRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Recarregar página
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                Voltar ao início
              </Button>
            </div>

            {this.state.error && (
              <details className="mt-4 text-left text-sm" open>
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto text-xs max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;
