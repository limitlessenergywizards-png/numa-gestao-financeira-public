'use client';

import { ReactNode } from 'react';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { motion } from 'framer-motion';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}

/**
 * Lazy loading wrapper for landing page sections
 * Only renders children when section enters viewport
 */
export function LazySection({ 
  children, 
  fallback, 
  rootMargin = '200px',
  minHeight = '400px'
}: LazySectionProps) {
  const { ref, isVisible } = useLazyVisible(rootMargin);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      ) : (
        fallback || <SectionSkeleton minHeight={minHeight} />
      )}
    </div>
  );
}

function SectionSkeleton({ minHeight }: { minHeight: string }) {
  return (
    <div 
      className="animate-pulse bg-gradient-to-b from-[#1B3B34]/30 to-[#17322C]/30"
      style={{ minHeight }}
    />
  );
}
