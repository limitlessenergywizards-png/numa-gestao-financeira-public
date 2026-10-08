import { toast } from "sonner";

export interface SafeAsyncOptions {
  onError?: (error: Error) => void;
  errorMessage?: string;
  showToast?: boolean;
  timeout?: number;
}

/**
 * Wrapper for async operations with standardized error handling
 * Returns a tuple [result, error] for easy destructuring
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options: SafeAsyncOptions = {}
): Promise<[T | null, Error | null]> {
  const { onError, errorMessage, showToast = false, timeout } = options;

  try {
    let result: T;

    if (timeout && timeout > 0) {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operação expirou após ${timeout}ms`));
        }, timeout);
      });

      // Race between the actual operation and the timeout
      result = await Promise.race([fn(), timeoutPromise]);
    } else {
      result = await fn();
    }

    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Log the error for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.error("[safeAsync]", {
        message: err.message,
        stack: err.stack,
      });
    }

    // Call custom error handler
    onError?.(err);

    // Show toast notification if requested
    if (showToast) {
      toast.error(errorMessage || "Ocorreu um erro. Tente novamente.");
    }

    return [null, err];
  }
}

/**
 * Wrapper that throws on error (for use in React Query)
 * Adds logging and optional timeout
 */
export async function safeAsyncThrow<T>(
  fn: () => Promise<T>,
  options: Omit<SafeAsyncOptions, "showToast"> = {}
): Promise<T> {
  const [result, error] = await safeAsync(fn, options);
  
  if (error) {
    throw error;
  }
  
  return result as T;
}
