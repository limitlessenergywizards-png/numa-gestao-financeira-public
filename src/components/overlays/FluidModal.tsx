'use client';

import { useEffect, useCallback, useRef, ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

// Spring configuration for snappy modal animations
const modalSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 30,
};

// Backdrop variants with progressive blur
const backdropVariants = {
  hidden: { 
    opacity: 0,
  },
  visible: { 
    opacity: 1,
  },
};

// Modal content variants
const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
};

// Size configurations
const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw] max-h-[90vh]',
};

interface FluidModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof sizeClasses;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const FluidModal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
}: FluidModalProps) => {
  const prefersReducedMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  // Focus management when open (scroll lock handled by Radix/react-remove-scroll)
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      return () => {
        clearTimeout(timer);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Animation config respecting reduced motion
  const animationConfig = prefersReducedMotion 
    ? { duration: 0.01 } 
    : modalSpring;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />
          
          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              'relative w-full',
              sizeClasses[size],
              'bg-background/95 backdrop-blur-xl',
              'border border-border/50',
              'rounded-xl shadow-2xl',
              'outline-none',
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={animationConfig}
          >
            {/* Close button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'absolute right-4 top-4 z-10',
                  'p-2 rounded-lg',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-accent/50',
                  'transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                )}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Subcomponents for structured content
interface ModalHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export const ModalHeader = ({ title, description, className }: ModalHeaderProps) => (
  <div className={cn('px-6 pt-6 pb-2', className)}>
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {description && (
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className }: ModalBodyProps) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => (
  <div className={cn(
    'px-6 py-4',
    'border-t border-border/50',
    'flex items-center justify-end gap-2',
    className
  )}>
    {children}
  </div>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useFluidModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle, setIsOpen };
};
