'use client';

import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * useSearchParamsState — Compatibility wrapper for Next.js search params
 *
 * react-router-dom's useSearchParams returns [searchParams, setSearchParams].
 * Next.js useSearchParams is read-only.
 *
 * This hook bridges the gap by providing a setter that uses router.replace()
 * to update URL search params without navigation.
 */
export function useSearchParamsState() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (
      updater:
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams),
    ) => {
      const current = new URLSearchParams(searchParams.toString());
      let next: URLSearchParams;

      if (typeof updater === 'function') {
        next = updater(current);
      } else {
        next = new URLSearchParams(updater);
      }

      // Remove empty values
      const cleaned = new URLSearchParams();
      next.forEach((value, key) => {
        if (value) cleaned.set(key, value);
      });

      const qs = cleaned.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return [searchParams, setSearchParams] as const;
}
