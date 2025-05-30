
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BackgroundAnimationContextType {
  isAnimationEnabled: boolean;
  toggleAnimation: () => void;
}

const BackgroundAnimationContext = createContext<BackgroundAnimationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'spiteSpiral_backgroundAnimationEnabled';

export const BackgroundAnimationProvider = ({ children }: { children: ReactNode }) => {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedPreference !== null ? JSON.parse(storedPreference) : true; // Default to true
    }
    return true; // Default for SSR
  });

  useEffect(() => {
    // Effect to initialize from localStorage on mount, only if window is defined
    const storedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedPreference !== null) {
      setIsAnimationEnabled(JSON.parse(storedPreference));
    }
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimationEnabled((prev) => {
      const newState = !prev;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  return (
    <BackgroundAnimationContext.Provider value={{ isAnimationEnabled, toggleAnimation }}>
      {children}
    </BackgroundAnimationContext.Provider>
  );
};

export const useBackgroundAnimation = (): BackgroundAnimationContextType => {
  const context = useContext(BackgroundAnimationContext);
  if (context === undefined) {
    throw new Error('useBackgroundAnimation must be used within a BackgroundAnimationProvider');
  }
  return context;
};
