/**
 * FilterStoreInitializer
 * 
 * Initializes the filter store with the current company.
 * This component should be placed inside CompanyProvider.
 */

import { useFilterStoreInit } from '@/hooks/useFilterStore';

export function FilterStoreInitializer(): null {
  useFilterStoreInit();
  return null;
}
