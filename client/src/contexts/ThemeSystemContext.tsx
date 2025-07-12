import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeColors, defaultTheme, applyTheme, getCurrentTheme, storeTheme } from '@/lib/theme';

interface ThemeSystemContextType {
  theme: ThemeColors;
  updateTheme: (colors: ThemeColors) => void;
  resetTheme: () => void;
}

const ThemeSystemContext = createContext<ThemeSystemContextType | undefined>(undefined);

export function ThemeSystemProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);

  useEffect(() => {
    // Initialize theme on app start with a slight delay to ensure DOM is ready
    const initTheme = () => {
      const savedTheme = getCurrentTheme();
      setTheme(savedTheme);
      applyTheme(savedTheme);
    };
    
    // Initialize immediately and also set a timeout as fallback
    initTheme();
    const timeoutId = setTimeout(initTheme, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const updateTheme = (colors: ThemeColors) => {
    setTheme(colors);
    applyTheme(colors);
    storeTheme(colors);
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    storeTheme(defaultTheme);
  };

  return (
    <ThemeSystemContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeSystemContext.Provider>
  );
}

export function useThemeSystem() {
  const context = useContext(ThemeSystemContext);
  if (context === undefined) {
    throw new Error('useThemeSystem must be used within a ThemeSystemProvider');
  }
  return context;
}