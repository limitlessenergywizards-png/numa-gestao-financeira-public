'use client';

import { useEffect, useCallback, useRef, ReactNode, useState } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

// Spring configuration for smooth sheet animations
const sheetSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[]; // Fractions of screen height (0.5 = 50%)
  initialSnapIndex?: number;
  closeThreshold?: number; // Velocity or offset to trigger close
  showHandle?: boolean;
  className?: string;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
  initialSnapIndex = 0,
  closeThreshold = 0.25,
  showHandle = true,
  className,
}: BottomSheetProps) => {
  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnapIndex);
  // Calculate snap point heights
  const getSnapHeight = useCallback((index: number) => {
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    return windowHeight * snapPoints[index];
  }, [snapPoints]);

  // Set initial snap when open (scroll lock handled by Radix/react-remove-scroll)
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(initialSnapIndex);
    }
  }, [isOpen, initialSnapIndex]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle drag end - determine snap or close
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    // Close if dragged down fast or far enough
    if (velocity > 500 || offset > windowHeight * closeThreshold) {
      onClose();
      return;
    }
    
    // Snap to nearest point based on current position
    const currentHeight = getSnapHeight(currentSnapIndex);
    const newHeight = currentHeight - offset;
    const newHeightFraction = newHeight / windowHeight;
    
    // Find closest snap point
    let closestIndex = 0;
    let closestDistance = Math.abs(snapPoints[0] - newHeightFraction);
    
    snapPoints.forEach((point, index) => {
      const distance = Math.abs(point - newHeightFraction);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    setCurrentSnapIndex(closestIndex);
  }, [currentSnapIndex, closeThreshold, onClose, snapPoints, getSnapHeight]);

  // Animation config respecting reduced motion
  const animationConfig = prefersReducedMotion 
    ? { duration: 0.01 } 
    : sheetSpring;

  // For reduced motion, disable drag gestures
  const dragProps = prefersReducedMotion ? {} : {
    drag: 'y' as const,
    dragControls,
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: { top: 0.1, bottom: 0.5 },
    onDragEnd: handleDragEnd,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'bg-background/95 backdrop-blur-xl',
              'border-t border-border/50',
              'rounded-t-3xl shadow-2xl',
              'overflow-hidden',
              className
            )}
            style={{ 
              height: `${snapPoints[currentSnapIndex] * 100}vh`,
              maxHeight: '90vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={animationConfig}
            {...dragProps}
          >
            {/* Handle */}
            {showHandle && (
              <div 
                className={cn(
                  'flex justify-center py-3',
                  !prefersReducedMotion && 'cursor-grab active:cursor-grabbing'
                )}
                onPointerDown={(e) => !prefersReducedMotion && dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            
            {/* Content */}
            <div 
              className="px-6 pb-6 overflow-y-auto" 
              style={{ 
                maxHeight: showHandle ? 'calc(100% - 28px)' : '100%' 
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Sheet Header component
interface SheetHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export const SheetHeader = ({ title, description, className }: SheetHeaderProps) => (
  <div className={cn('pb-4 border-b border-border/50', className)}>
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {description && (
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);

// Sheet Action Button
interface SheetActionProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const SheetAction = ({ 
  icon, 
  children, 
  onClick, 
  variant = 'default',
  className 
}: SheetActionProps) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
      'text-left transition-colors duration-150',
      variant === 'default' && 'hover:bg-accent/50 text-foreground',
      variant === 'destructive' && 'hover:bg-destructive/10 text-destructive',
      className
    )}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span className="font-medium">{children}</span>
  </button>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useBottomSheet = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle, setIsOpen };
};
