/**
 * Cross-browser utility for scheduling idle callbacks with fallback support.
 * Prefers requestIdleCallback on supporting browsers, falls back to setTimeout.
 */

export interface IdleCallbackOptions {
  timeout?: number;
}

/**
 * Schedule a callback to execute during browser idle time or after timeout.
 *
 * @param callback - Function to execute
 * @param options - Configuration (timeout in ms)
 * @returns Cleanup function to cancel the scheduled callback
 */
export function scheduleIdleTask(
  callback: () => void,
  options: IdleCallbackOptions = {}
): () => void {
  const { timeout = 3000 } = options;

  // Use requestIdleCallback if available, fallback to setTimeout
  const isIdleCallbackSupported = typeof window !== 'undefined' && 'requestIdleCallback' in window;

  if (isIdleCallbackSupported) {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = setTimeout(callback, timeout);
  return () => clearTimeout(id);
}
