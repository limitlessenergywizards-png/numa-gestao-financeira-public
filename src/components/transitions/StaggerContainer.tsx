import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { useAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

const pageEasing = [0.25, 0.1, 0.25, 1] as const;

// ─── StaggerContainer ───

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  triggerMode?: 'inView' | 'immediate';
}

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.08,
  delayChildren = 0.1,
  triggerMode = 'inView',
}: StaggerContainerProps) => {
  const { isEnabled, getDuration } = useAnimation();

  if (!isEnabled) {
    return <div className={className}>{children}</div>;
  }

  const customVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: getDuration(staggerDelay),
        delayChildren: getDuration(delayChildren),
      },
    },
  };

  const inViewProps = triggerMode === 'inView'
    ? { whileInView: 'visible' as const, viewport: { once: true, amount: 0.1 } }
    : { animate: 'visible' as const };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      variants={customVariants}
      {...inViewProps}
    >
      {children}
    </motion.div>
  );
};

// ─── StaggerItem ───

type Direction = 'up' | 'down' | 'left' | 'right';

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}

const getItemVariants = (direction: Direction): Variants => {
  const offsets: Record<Direction, { x?: number; y?: number }> = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return {
    hidden: { opacity: 0, scale: 0.98, ...offsets[direction] },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.4,
        ease: pageEasing,
      },
    },
  };
};

export const StaggerItem = ({
  children,
  className,
  direction = 'up',
}: StaggerItemProps) => (
  <motion.div
    className={cn(className)}
    variants={getItemVariants(direction)}
  >
    {children}
  </motion.div>
);
