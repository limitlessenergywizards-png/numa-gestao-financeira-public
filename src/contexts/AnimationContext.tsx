'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

type AnimationSpeed = 0.5 | 1 | 1.5 | 2;

interface AnimationContextValue {
  // Animation state
  isEnabled: boolean;
  speed: AnimationSpeed;
  prefersReducedMotion: boolean;
  isBatterySaver: boolean;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setSpeed: (speed: AnimationSpeed) => void;
  setBatterySaver: (enabled: boolean) => void;
  toggleAnimations: () => void;

  // Computed helpers
  getDuration: (baseDuration: number) => number;
  getDelay: (baseDelay: number) => number;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

const STORAGE_KEY = 'numa-animation-prefs';

interface StoredPrefs {
  isEnabled: boolean;
  speed: AnimationSpeed;
  isBatterySaver: boolean;
}

const getStoredPrefs = (): Partial<StoredPrefs> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setStoredPrefs = (prefs: StoredPrefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
};

interface AnimationProviderProps {
  children: ReactNode;
  defaultEnabled?: boolean;
  defaultSpeed?: AnimationSpeed;
}

export const AnimationProvider = ({
  children,
  defaultEnabled = true,
  defaultSpeed = 1,
}: AnimationProviderProps) => {
  // Check system preference for reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Load stored preferences
  const storedPrefs = useMemo(() => getStoredPrefs(), []);

  const [isEnabled, setIsEnabled] = useState(
    storedPrefs.isEnabled ?? defaultEnabled
  );
  const [speed, setSpeedState] = useState<AnimationSpeed>(
    storedPrefs.speed ?? defaultSpeed
  );
  const [isBatterySaver, setIsBatterySaver] = useState(
    storedPrefs.isBatterySaver ?? false
  );

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Persist preferences
  useEffect(() => {
    setStoredPrefs({ isEnabled, speed, isBatterySaver });
  }, [isEnabled, speed, isBatterySaver]);

  // Actions
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  const setSpeed = useCallback((newSpeed: AnimationSpeed) => {
    setSpeedState(newSpeed);
  }, []);

  const setBatterySaver = useCallback((enabled: boolean) => {
    setIsBatterySaver(enabled);
    if (enabled) {
      setSpeedState(2); // Faster animations in battery saver
    }
  }, []);

  const toggleAnimations = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  // Duration/delay modifiers based on speed
  const getDuration = useCallback(
    (baseDuration: number) => {
      if (!isEnabled || prefersReducedMotion) return 0;
      if (isBatterySaver) return baseDuration * 0.5;
      return baseDuration / speed;
    },
    [isEnabled, prefersReducedMotion, isBatterySaver, speed]
  );

  const getDelay = useCallback(
    (baseDelay: number) => {
      if (!isEnabled || prefersReducedMotion) return 0;
      if (isBatterySaver) return baseDelay * 0.5;
      return baseDelay / speed;
    },
    [isEnabled, prefersReducedMotion, isBatterySaver, speed]
  );

  const value = useMemo<AnimationContextValue>(
    () => ({
      isEnabled: isEnabled && !prefersReducedMotion,
      speed,
      prefersReducedMotion,
      isBatterySaver,
      setEnabled,
      setSpeed,
      setBatterySaver,
      toggleAnimations,
      getDuration,
      getDelay,
    }),
    [
      isEnabled,
      speed,
      prefersReducedMotion,
      isBatterySaver,
      setEnabled,
      setSpeed,
      setBatterySaver,
      toggleAnimations,
      getDuration,
      getDelay,
    ]
  );

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAnimation = (): AnimationContextValue => {
  const context = useContext(AnimationContext);
  if (!context) {
    // Return default values if used outside provider (graceful fallback)
    return {
      isEnabled: true,
      speed: 1,
      prefersReducedMotion: false,
      isBatterySaver: false,
      setEnabled: () => {},
      setSpeed: () => {},
      setBatterySaver: () => {},
      toggleAnimations: () => {},
      getDuration: (d) => d,
      getDelay: (d) => d,
    };
  }
  return context;
};

// Hook for reduced motion preference only (lightweight)
// eslint-disable-next-line react-refresh/only-export-components
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};
