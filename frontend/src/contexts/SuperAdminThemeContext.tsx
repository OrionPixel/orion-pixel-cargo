import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SuperAdminThemeSettings {
  id?: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'light' | 'dark';
}

interface SuperAdminThemeContextType {
  themeSettings: SuperAdminThemeSettings;
  updateTheme: (settings: Partial<SuperAdminThemeSettings>) => void;
  isLoading: boolean;
}

const SuperAdminThemeContext = createContext<SuperAdminThemeContextType | undefined>(undefined);

// Default super admin theme colors - matching original purple theme
const defaultSuperAdminTheme: SuperAdminThemeSettings = {
  primaryColor: '#8427d7', // Original purple
  secondaryColor: '#A7A9AC', // Original gray
  accentColor: '#DCDDDE', // Original light gray
  theme: 'light'
};

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applySuperAdminTheme(settings: SuperAdminThemeSettings) {
  const root = document.documentElement;
  
  // Convert hex to HSL for CSS variables
  const primaryHSL = hexToHSL(settings.primaryColor);
  const secondaryHSL = hexToHSL(settings.secondaryColor);
  const accentHSL = hexToHSL(settings.accentColor);
  
  // Apply shadcn/ui variables
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);  
  root.style.setProperty('--accent', accentHSL);
  root.style.setProperty('--primary-foreground', '0 0% 98%');
  root.style.setProperty('--secondary-foreground', '0 0% 9%');
  root.style.setProperty('--accent-foreground', '0 0% 9%');
  
  // Apply RealtimeColors variables for legacy compatibility
  root.style.setProperty('--color-primary-500', settings.primaryColor);
  root.style.setProperty('--color-secondary-500', settings.secondaryColor);
  root.style.setProperty('--color-accent-500', settings.accentColor);
  
  // Extended color scales for all theme colors
  const [hp, sp, lp] = primaryHSL.split(' ').map((v, i) => i === 0 ? parseInt(v) : parseFloat(v.replace('%', '')));
  const [hs, ss, ls] = secondaryHSL.split(' ').map((v, i) => i === 0 ? parseInt(v) : parseFloat(v.replace('%', '')));
  const [ha, sa, la] = accentHSL.split(' ').map((v, i) => i === 0 ? parseInt(v) : parseFloat(v.replace('%', '')));
  
  // Primary scale
  root.style.setProperty('--color-primary-50', `hsl(${hp}, ${Math.min(sp + 15, 100)}%, ${Math.min(lp + 45, 98)}%)`);
  root.style.setProperty('--color-primary-100', `hsl(${hp}, ${Math.min(sp + 10, 100)}%, ${Math.min(lp + 40, 95)}%)`);
  root.style.setProperty('--color-primary-200', `hsl(${hp}, ${Math.min(sp + 5, 100)}%, ${Math.min(lp + 30, 90)}%)`);
  root.style.setProperty('--color-primary-300', `hsl(${hp}, ${sp}%, ${Math.min(lp + 20, 85)}%)`);
  root.style.setProperty('--color-primary-600', `hsl(${hp}, ${sp}%, ${Math.max(lp - 10, 10)}%)`);
  root.style.setProperty('--color-primary-700', `hsl(${hp}, ${sp}%, ${Math.max(lp - 20, 5)}%)`);
  
  // Secondary scale  
  root.style.setProperty('--color-secondary-50', `hsl(${hs}, ${Math.min(ss + 15, 100)}%, ${Math.min(ls + 45, 98)}%)`);
  root.style.setProperty('--color-secondary-100', `hsl(${hs}, ${Math.min(ss + 10, 100)}%, ${Math.min(ls + 40, 95)}%)`);
  root.style.setProperty('--color-secondary-200', `hsl(${hs}, ${Math.min(ss + 5, 100)}%, ${Math.min(ls + 30, 90)}%)`);
  root.style.setProperty('--color-secondary-300', `hsl(${hs}, ${ss}%, ${Math.min(ls + 20, 85)}%)`);
  root.style.setProperty('--color-secondary-600', `hsl(${hs}, ${ss}%, ${Math.max(ls - 10, 10)}%)`);
  root.style.setProperty('--color-secondary-700', `hsl(${hs}, ${ss}%, ${Math.max(ls - 20, 5)}%)`);
  
  // Accent scale
  root.style.setProperty('--color-accent-50', `hsl(${ha}, ${Math.min(sa + 15, 100)}%, ${Math.min(la + 45, 98)}%)`);
  root.style.setProperty('--color-accent-100', `hsl(${ha}, ${Math.min(sa + 10, 100)}%, ${Math.min(la + 40, 95)}%)`);
  root.style.setProperty('--color-accent-200', `hsl(${ha}, ${Math.min(sa + 5, 100)}%, ${Math.min(la + 30, 90)}%)`);
  root.style.setProperty('--color-accent-300', `hsl(${ha}, ${sa}%, ${Math.min(la + 20, 85)}%)`);
  root.style.setProperty('--color-accent-600', `hsl(${ha}, ${sa}%, ${Math.max(la - 10, 10)}%)`);
  root.style.setProperty('--color-accent-700', `hsl(${ha}, ${sa}%, ${Math.max(la - 20, 5)}%)`);
  
  console.log('🎨 Applied Super Admin theme colors:', {
    primary: primaryHSL,
    secondary: secondaryHSL,
    accent: accentHSL,
    primaryHex: settings.primaryColor,
    secondaryHex: settings.secondaryColor,
    accentHex: settings.accentColor
  });
}

export function SuperAdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeSettings, setThemeSettings] = useState<SuperAdminThemeSettings>(defaultSuperAdminTheme);
  const queryClient = useQueryClient();

  // Apply default theme immediately on mount to prevent flash
  useEffect(() => {
    applySuperAdminTheme(defaultSuperAdminTheme);
  }, []);

  // Fetch super admin theme settings
  const { data: superAdminTheme, isLoading } = useQuery({
    queryKey: ['/api/admin/theme-settings'],
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchInterval: false
  });

  useEffect(() => {
    if (superAdminTheme) {
      const updatedSettings = {
        ...defaultSuperAdminTheme,
        ...superAdminTheme
      };
      setThemeSettings(updatedSettings);
      applySuperAdminTheme(updatedSettings);
      console.log('🌍 Super Admin Theme loaded:', updatedSettings);
    }
  }, [superAdminTheme]);

  const updateTheme = (newSettings: Partial<SuperAdminThemeSettings>) => {
    const updatedSettings = { ...themeSettings, ...newSettings };
    setThemeSettings(updatedSettings);
    applySuperAdminTheme(updatedSettings);
    
    // Force immediate refresh of query cache
    queryClient.invalidateQueries({ queryKey: ['/api/admin/theme-settings'] });
  };

  return (
    <SuperAdminThemeContext.Provider value={{ themeSettings, updateTheme, isLoading }}>
      {children}
    </SuperAdminThemeContext.Provider>
  );
}

export function useSuperAdminTheme() {
  const context = useContext(SuperAdminThemeContext);
  if (context === undefined) {
    throw new Error('useSuperAdminTheme must be used within a SuperAdminThemeProvider');
  }
  return context;
}