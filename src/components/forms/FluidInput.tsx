'use client';

import { useState, forwardRef, useId, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface FluidInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const labelSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const FluidInput = forwardRef<HTMLInputElement, FluidInputProps>(
  ({ label, error, icon, className, disabled, onFocus, onBlur, onChange, value, defaultValue, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);
    const prefersReducedMotion = useReducedMotion();
    
    const inputId = useId();
    const errorId = useId();
    
    const isActive = isFocused || hasValue;
    
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);
    
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    }, [onBlur]);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    }, [onChange]);
    
    // Sync hasValue when controlled value changes
    useEffect(() => {
      if (value !== undefined) {
        setHasValue(!!value);
      }
    }, [value]);
    
    return (
      <div className={cn('relative', className)}>
        {/* Input container */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div 
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none',
                error 
                  ? 'text-destructive' 
                  : isFocused 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
              )}
            >
              {icon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'w-full px-4 py-4 rounded-xl',
              'bg-background border transition-[border-color,box-shadow,background-color] duration-200',
              'text-foreground placeholder-transparent',
              'focus:outline-none',
              icon && 'pl-12',
              error 
                ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
                : isFocused 
                  ? 'border-ring bg-background/80 ring-2 ring-ring/20' 
                  : 'border-border hover:border-border/80',
              disabled && 'opacity-50 cursor-not-allowed bg-muted'
            )}
            placeholder={label}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          
          {/* Floating label */}
          <motion.label
            htmlFor={inputId}
            className={cn(
              'absolute pointer-events-none origin-left',
              'transition-colors duration-200',
              icon ? 'left-12' : 'left-4',
              error 
                ? 'text-destructive' 
                : isFocused 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
            )}
            animate={{
              top: isActive ? '0px' : '50%',
              y: '-50%',
              scale: isActive ? 0.85 : 1,
              x: isActive ? -4 : 0,
            }}
            transition={prefersReducedMotion ? { duration: 0 } : labelSpring}
          >
            <span 
              className={cn(
                'inline-block transition-colors duration-200',
                isActive && 'bg-background px-2 rounded'
              )}
            >
              {label}
            </span>
          </motion.label>
        </div>
        
        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              id={errorId}
              role="alert"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-destructive text-sm mt-1.5 ml-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FluidInput.displayName = 'FluidInput';
