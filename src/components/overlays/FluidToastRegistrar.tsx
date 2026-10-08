'use client';

import { useEffect } from 'react';
import { useFluidToast, registerGlobalToast } from './FluidToast';

/**
 * FluidToastRegistrar - Registers the global toast function
 * 
 * This component should be placed inside FluidToastProvider to enable
 * the use of fluidToast() outside of React components.
 * 
 * Usage:
 * ```tsx
 * <FluidToastProvider>
 *   <FluidToastRegistrar />
 *   {children}
 * </FluidToastProvider>
 * ```
 * 
 * Then anywhere in your code:
 * ```tsx
 * import { fluidToast } from '@/components/overlays';
 * fluidToast.success('Saved!');
 * ```
 */
export const FluidToastRegistrar = () => {
  const { showToast } = useFluidToast();
  
  useEffect(() => {
    registerGlobalToast((type, message, description, duration) => {
      showToast[type](message, description, duration);
    });
    
    // Cleanup on unmount
    return () => {
      registerGlobalToast(() => {});
    };
  }, [showToast]);
  
  return null;
};
