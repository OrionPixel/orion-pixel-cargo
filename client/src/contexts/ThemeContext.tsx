import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  updateColors: (colors: ThemeColors) => void;
  resetToDefault: () => void;
}

const defaultColors: ThemeColors = {
  primary: '132, 39, 215', // #8427d7
  secondary: '167, 169, 172', // #A7A9AC
  accent: '220, 221, 222' // #DCDDDE
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  // Load colors from localStorage on mount
  useEffect(() => {
    // Always apply the default purple theme first
    applyColorsToCSS(defaultColors);
    
    const savedColors = localStorage.getItem('cargoflow-theme-colors');
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors);
        setColors(parsedColors);
        applyColorsToCSS(parsedColors);
      } catch (error) {
        console.error('Failed to parse saved theme colors:', error);
        applyColorsToCSS(defaultColors);
      }
    } else {
      setColors(defaultColors);
    }
  }, []);

  // Apply colors to CSS custom properties
  const applyColorsToCSS = (themeColors: ThemeColors) => {
    const root = document.documentElement;
    
    // Original theme variables (RGB format)
    root.style.setProperty('--color-primary', themeColors.primary);
    root.style.setProperty('--color-secondary', themeColors.secondary);
    root.style.setProperty('--color-accent', themeColors.accent);
    
    // Convert RGB to hex for consistency
    const rgbToHex = (rgb: string) => {
      const [r, g, b] = rgb.split(',').map(v => parseInt(v.trim()));
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    };
    
    // Apply as hex values to other variables
    root.style.setProperty('--color-primary-500', rgbToHex(themeColors.primary));
    root.style.setProperty('--color-secondary-500', rgbToHex(themeColors.secondary));
    root.style.setProperty('--color-accent-500', rgbToHex(themeColors.accent));
    
    // Force apply original purple theme in HSL format for shadcn
    root.style.setProperty('--primary', '272 69% 50%'); // #8427d7
    root.style.setProperty('--secondary', '216 3% 66%'); // #A7A9AC  
    root.style.setProperty('--accent', '210 3% 87%'); // #DCDDDE
  };

  const updateColors = (newColors: ThemeColors) => {
    setColors(newColors);
    localStorage.setItem('cargoflow-theme-colors', JSON.stringify(newColors));
    applyColorsToCSS(newColors);
  };

  const resetToDefault = () => {
    setColors(defaultColors);
    localStorage.removeItem('cargoflow-theme-colors');
    applyColorsToCSS(defaultColors);
  };

  return (
    <ThemeContext.Provider value={{ colors, updateColors, resetToDefault }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Utility function to convert hex to RGB values
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '0, 0, 0';
};

// Utility function to convert RGB values to hex
export const rgbToHex = (rgb: string): string => {
  const values = rgb.split(',').map(v => parseInt(v.trim()));
  return `#${values.map(v => v.toString(16).padStart(2, '0')).join('')}`;
};