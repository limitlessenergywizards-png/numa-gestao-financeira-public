'use client';

import { useState, forwardRef, useId, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface FluidTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  showCount?: boolean;
  autoResize?: boolean;
  maxHeight?: number;
}

const labelSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const FluidTextarea = forwardRef<HTMLTextAreaElement, FluidTextareaProps>(
  ({ 
    label, 
    error, 
    showCount = false, 
    autoResize = false, 
    maxHeight = 300,
    maxLength,
    className, 
    disabled, 
    onFocus, 
    onBlur, 
    onChange, 
    value, 
    defaultValue, 
    rows = 3,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);
    const [charCount, setCharCount] = useState(
      typeof value === 'string' ? value.length : 
      typeof defaultValue === 'string' ? defaultValue.length : 0
    );
    const prefersReducedMotion = useReducedMotion();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    
    const textareaId = useId();
    const errorId = useId();
    const countId = useId();
    
    const isActive = isFocused || hasValue;
    
    // Merge refs
    const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);
    
    // Auto-resize logic
    useEffect(() => {
      if (autoResize && internalRef.current) {
        const textarea = internalRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      }
    }, [value, autoResize, maxHeight]);
    
    const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);
    
    const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    }, [onBlur]);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setHasValue(!!newValue);
      setCharCount(newValue.length);
      
      if (autoResize && internalRef.current) {
        const textarea = internalRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      }
      
      onChange?.(e);
    }, [onChange, autoResize, maxHeight]);
    
    // Sync hasValue when controlled value changes
    useEffect(() => {
      if (value !== undefined) {
        setHasValue(!!value);
      }
    }, [value]);
    
    const describedBy = [
      error ? errorId : null,
      showCount && maxLength ? countId : null,
    ].filter(Boolean).join(' ') || undefined;
    
    return (
      <div className={cn('relative', className)}>
        {/* Textarea container */}
        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={setRefs}
            id={textareaId}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'w-full px-4 py-4 rounded-xl resize-none',
              'bg-background border transition-[border-color,box-shadow,background-color] duration-200',
              'text-foreground placeholder-transparent',
              'focus:outline-none',
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
            htmlFor={textareaId}
            className={cn(
              'absolute left-4 pointer-events-none origin-left',
              'transition-colors duration-200',
              error 
                ? 'text-destructive' 
                : isFocused 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
            )}
            animate={{
              top: isActive ? '0px' : '24px',
              y: isActive ? '-50%' : '-50%',
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
        
        {/* Bottom row: error and character count */}
        <div className="flex items-start justify-between mt-1.5 ml-1 gap-4">
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                id={errorId}
                role="alert"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-destructive text-sm flex-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          
          {/* Character count */}
          {showCount && maxLength && (
            <span 
              id={countId}
              className={cn(
                'text-xs ml-auto',
                charCount > maxLength * 0.9 
                  ? 'text-warning' 
                  : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

FluidTextarea.displayName = 'FluidTextarea';
