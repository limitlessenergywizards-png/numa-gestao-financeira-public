'use client';

import { useState, useCallback, useRef } from 'react';

export type CelebrationType = 'confetti' | 'sparkle' | 'pulse' | 'success';

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

interface UseCelebrationOptions {
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  'hsl(142, 25%, 42%)', // metallic-400
  'hsl(132, 35%, 53%)', // metallic-300
  'hsl(98, 40%, 62%)',  // metallic-200
  'hsl(42, 50%, 56%)',  // brand gold
  'hsl(38, 92%, 50%)',  // warning amber
];

export function useCelebration(options: UseCelebrationOptions = {}) {
  const { 
    particleCount = 20, 
    duration = 1500,
    colors = DEFAULT_COLORS 
  } = options;
  
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [celebrationType, setCelebrationType] = useState<CelebrationType>('confetti');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trigger = useCallback((type: CelebrationType = 'confetti', origin?: { x: number; y: number }) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setCelebrationType(type);
    setIsActive(true);
    
    // Generate particles based on type
    const newParticles: Particle[] = [];
    const centerX = origin?.x ?? 50;
    const centerY = origin?.y ?? 50;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = 50 + Math.random() * 100;
      
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        x: centerX + Math.cos(angle) * velocity * (type === 'confetti' ? 1 : 0.5),
        y: centerY + Math.sin(angle) * velocity * (type === 'confetti' ? 1.5 : 0.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        rotation: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 0.5,
      });
    }
    
    setParticles(newParticles);
    
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setParticles([]);
    }, duration);
  }, [particleCount, duration, colors]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsActive(false);
    setParticles([]);
  }, []);

  return {
    isActive,
    particles,
    celebrationType,
    trigger,
    reset,
    duration,
  };
}
