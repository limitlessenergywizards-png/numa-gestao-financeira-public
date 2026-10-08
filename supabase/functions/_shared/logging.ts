/**
 * Creates a scoped logging function for an Edge Function.
 *
 * Usage:
 *   const log = createLogger("CHECK-SUBSCRIPTION");
 *   log("User authenticated", { userId });
 */
export function createLogger(
  functionName: string
): (step: string, details?: unknown) => void {
  return (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
    console.log(`[${functionName}] ${step}${detailsStr}`);
  };
}
