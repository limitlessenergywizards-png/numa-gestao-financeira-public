import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

const pageEasing = [0.25, 0.1, 0.25, 1] as const;

type Direction = 'up' | 'down' | 'left' | 'right';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
}

const getInitial = (direction: Direction, distance: number) => {
  const offsets: Record<Direction, { x?: number; y?: number }> = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };
  return { opacity: 0, ...offsets[direction] };
};

export const FadeIn = ({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 24,
  once = true,
}: FadeInProps) => {
  const { isEnabled, getDuration, getDelay } = useAnimation();

  if (!isEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={getInitial(direction, distance)}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{
        duration: getDuration(duration),
        delay: getDelay(delay),
        ease: pageEasing,
      }}
    >
      {children}
    </motion.div>
  );
};
