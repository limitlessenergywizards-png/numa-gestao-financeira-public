'use client';

import { createContext, useContext, useCallback, useMemo, useState, ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

// Spring configuration for bouncy toast animations
const toastSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

// Toast configuration by type
const toastConfig: Record<ToastType, { 
  icon: typeof CheckCircle; 
  className: string;
  iconClassName: string;
}> = {
  success: {
    icon: CheckCircle,
    className: 'bg-emerald-500/10 border-emerald-500/20',
    iconClassName: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    className: 'bg-destructive/10 border-destructive/20',
    iconClassName: 'text-destructive',
  },
  info: {
    icon: Info,
    className: 'bg-blue-500/10 border-blue-500/20',
    iconClassName: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-500/10 border-amber-500/20',
    iconClassName: 'text-amber-500',
  },
};

// Toast Context
interface ToastContextValue {
  toasts: Toast[];
  showToast: {
    success: (message: string, description?: string, duration?: number) => void;
    error: (message: string, description?: string, duration?: number) => void;
    info: (message: string, description?: string, duration?: number) => void;
    warning: (message: string, description?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Toast Provider
interface FluidToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const FluidToastProvider = ({ 
  children, 
  position = 'bottom-right',
  maxToasts = 5,
}: FluidToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((type: ToastType, message: string, description?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    setToasts(prev => {
      const newToasts = [...prev, { id, type, message, description, duration }];
      // Limit number of toasts
      if (newToasts.length > maxToasts) {
        const removed = newToasts.shift();
        if (removed) {
          const timeout = timeoutsRef.current.get(removed.id);
          if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(removed.id);
          }
        }
      }
      return newToasts;
    });

    // Auto remove after duration
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [maxToasts, removeToast]);

  const showToast = useMemo(() => ({
    success: (message: string, description?: string, duration?: number) =>
      addToast('success', message, description, duration),
    error: (message: string, description?: string, duration?: number) =>
      addToast('error', message, description, duration),
    info: (message: string, description?: string, duration?: number) =>
      addToast('info', message, description, duration),
    warning: (message: string, description?: string, duration?: number) =>
      addToast('warning', message, description, duration),
  }), [addToast]);

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const contextValue = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        removeToast={removeToast} 
        position={positionClasses[position]}
      />
    </ToastContext.Provider>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
  position: string;
}

const ToastContainer = ({ toasts, removeToast, position }: ToastContainerProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div 
      className={cn(
        'fixed z-[100] flex flex-col gap-2 pointer-events-none',
        position
      )}
      role="region"
      aria-label="Notificações"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              layout={!prefersReducedMotion}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : toastSpring}
              role="status"
              className={cn(
                'pointer-events-auto',
                'flex items-start gap-3 min-w-[300px] max-w-md',
                'px-4 py-3 rounded-xl',
                'backdrop-blur-xl border shadow-lg',
                'bg-background/95',
                config.className
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{toast.message}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>
                )}
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className={cn(
                  'flex-shrink-0 p-1 rounded-md',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-accent/50 transition-colors duration-150'
                )}
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Hook to use toast
export const useFluidToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useFluidToast must be used within a FluidToastProvider');
  }
  
  return context;
};

// Standalone toast functions (for use without context)
// These use a simple global state pattern
let globalAddToast: ((type: ToastType, message: string, description?: string, duration?: number) => void) | null = null;

export const registerGlobalToast = (
  addFn: (type: ToastType, message: string, description?: string, duration?: number) => void
) => {
  globalAddToast = addFn;
};

export const fluidToast = {
  success: (message: string, description?: string, duration?: number) => {
    globalAddToast?.('success', message, description, duration);
  },
  error: (message: string, description?: string, duration?: number) => {
    globalAddToast?.('error', message, description, duration);
  },
  info: (message: string, description?: string, duration?: number) => {
    globalAddToast?.('info', message, description, duration);
  },
  warning: (message: string, description?: string, duration?: number) => {
    globalAddToast?.('warning', message, description, duration);
  },
};
