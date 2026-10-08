'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface FluidSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface FluidSelectProps {
  options: FluidSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const dropdownSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

const labelSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const FluidSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  label,
  error,
  disabled = false,
  className,
}: FluidSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  const triggerId = useId();
  const listboxId = useId();
  const labelId = useId();
  const errorId = useId();
  
  const selectedOption = options.find((o) => o.value === value);
  const isActive = isFocused || isOpen || !!selectedOption;
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);
  
  // Reset highlight when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((o) => o.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, options, value]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((i) => {
            let next = i + 1;
            while (next < options.length && options[next].disabled) next++;
            return next < options.length ? next : i;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((i) => {
            let prev = i - 1;
            while (prev >= 0 && options[prev].disabled) prev--;
            return prev >= 0 ? prev : i;
          });
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        if (isOpen) {
          const firstEnabled = options.findIndex((o) => !o.disabled);
          if (firstEnabled >= 0) setHighlightedIndex(firstEnabled);
        }
        break;
      case 'End':
        e.preventDefault();
        if (isOpen) {
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setHighlightedIndex(i);
              break;
            }
          }
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, options, onChange]);
  
  const handleOptionClick = useCallback((option: FluidSelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  }, [onChange]);
  
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Floating label */}
      <motion.label
        id={labelId}
        className={cn(
          'absolute left-4 pointer-events-none origin-left z-10',
          'transition-colors duration-200',
          error 
            ? 'text-destructive' 
            : isFocused || isOpen
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
      
      {/* Trigger */}
      <motion.button
        type="button"
        id={triggerId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={labelId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-4 rounded-xl',
          'bg-background border transition-[border-color,box-shadow,background-color] duration-200',
          'flex items-center justify-between gap-3',
          'text-left focus:outline-none',
          error 
            ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
            : isOpen || isFocused
              ? 'border-ring bg-background/80 ring-2 ring-ring/20' 
              : 'border-border hover:border-border/80',
          disabled && 'opacity-50 cursor-not-allowed bg-muted'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !isOpen && setIsFocused(false)}
        whileTap={!disabled && !prefersReducedMotion ? { scale: 0.99 } : undefined}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </motion.button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className={cn(
              'absolute z-50 w-full mt-2 py-2 rounded-xl',
              'bg-popover border border-border',
              'shadow-lg overflow-hidden max-h-60 overflow-y-auto'
            )}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            transition={dropdownSpring}
          >
            {options.map((option, index) => (
              <motion.li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                className={cn(
                  'px-4 py-3 cursor-pointer transition-colors',
                  'flex items-center gap-3',
                  option.value === value && 'bg-accent text-accent-foreground',
                  index === highlightedIndex && option.value !== value && 'bg-muted',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                whileHover={!option.disabled && !prefersReducedMotion ? { x: 4 } : undefined}
                transition={{ duration: 0.1 }}
              >
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                <span className="flex-1">{option.label}</span>
                {option.value === value && (
                  <motion.span
                    initial={prefersReducedMotion ? undefined : { scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-destructive text-sm mt-1.5 ml-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

FluidSelect.displayName = 'FluidSelect';
