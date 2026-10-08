import { ReactNode } from 'react';

export type TransitionVariant = 'default' | 'back' | 'modal' | 'none';

interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
}

export const PageTransition = ({
  children,
  variant = 'default',
  className = '',
}: PageTransitionProps) => {
  if (variant === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

// Child animation variants for staggered content
export const childVariants = {};

// Animated child wrapper for staggered animations
export const AnimatedChild = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
