import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

interface UserThemeSettings {
  id?: number;
  userId?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'light' | 'dark';
  logoUrl?: string | null;
}

interface UserThemeContextType {
  themeSettings: UserThemeSettings;
  updateTheme: (settings: Partial<UserThemeSettings>) => void;
  isLoading: boolean;
}

const UserThemeContext = createContext<UserThemeContextType | undefined>(undefined);

// Default user theme colors
const defaultUserTheme: UserThemeSettings = {
  primaryColor: '#3094d1', // Blue
  secondaryColor: '#3195d1', // Blue shade 2
  accentColor: '#3296d1', // Blue shade 3
  theme: 'light',
  logoUrl: null
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

function applyUserThemeColors(settings: UserThemeSettings) {
  const primaryHSL = hexToHSL(settings.primaryColor);
  const secondaryHSL = hexToHSL(settings.secondaryColor);
  const accentHSL = hexToHSL(settings.accentColor);

  const colors = {
    primary: primaryHSL,
    secondary: secondaryHSL,
    accent: accentHSL,
    primaryHex: settings.primaryColor,
    secondaryHex: settings.secondaryColor,
    accentHex: settings.accentColor
  };

  console.log('🎨 Applied user theme colors:', colors);

  const root = document.documentElement;
  
  // Set user theme CSS variables
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--accent', accentHSL);
  
  // Set derived colors
  root.style.setProperty('--primary-foreground', '210 40% 98%');
  root.style.setProperty('--secondary-foreground', '222.2 84% 4.9%');
  root.style.setProperty('--accent-foreground', '222.2 84% 4.9%');
  
  // Set background and surface colors
  root.style.setProperty('--background', '0 0% 100%');
  root.style.setProperty('--foreground', '222.2 84% 4.9%');
  root.style.setProperty('--card', '0 0% 100%');
  root.style.setProperty('--card-foreground', '222.2 84% 4.9%');
  root.style.setProperty('--surface', '0 0% 98%');
  
  // Set border and input colors
  root.style.setProperty('--border', '214.3 31.8% 91.4%');
  root.style.setProperty('--input', '214.3 31.8% 91.4%');
  root.style.setProperty('--ring', primaryHSL);
  
  // Set muted colors
  root.style.setProperty('--muted', '210 40% 96%');
  root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
  
  // Set destructive colors
  root.style.setProperty('--destructive', '0 84.2% 60.2%');
  root.style.setProperty('--destructive-foreground', '210 40% 98%');
}

export function UserThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [localSettings, setLocalSettings] = useState<UserThemeSettings>(() => {
    // EVENT-BASED: Apply instant theme without server dependency
    console.log('🎨 EVENT-BASED: Initializing instant theme system');
    applyUserThemeColors(defaultUserTheme);
    
    // Use cached theme data for instant loading (no server calls)
    if (typeof window !== 'undefined') {
      try {
        // Check for any existing user theme in localStorage
        const allKeys = Object.keys(localStorage);
        const themeKey = allKeys.find(key => key.startsWith('userTheme_'));
        
        if (themeKey) {
          const savedTheme = localStorage.getItem(themeKey);
          if (savedTheme) {
            const parsedTheme = JSON.parse(savedTheme);
            console.log('🎨 EVENT-BASED: Applied cached theme instantly:', parsedTheme);
            applyUserThemeColors(parsedTheme);
            return { ...defaultUserTheme, ...parsedTheme };
          }
        }
      } catch (error) {
        console.log('🎨 EVENT-BASED: Using default theme');
      }
    }
    return defaultUserTheme;
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Store user ID in sessionStorage for instant access
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('tempUserId', user.id);
    }
  }, [user]);

  // Initialize theme immediately when user is available
  useEffect(() => {
    if (user && !hasInitialized && (user.role === 'transporter' || user.role === 'distributor' || user.role === 'warehouse' || user.role === 'office')) {
      console.log('🎨 INIT: Checking localStorage for user theme:', user.id);
      const savedTheme = localStorage.getItem(`userTheme_${user.id}`);
      console.log('🎨 INIT: Found saved theme:', savedTheme);
      
      if (savedTheme) {
        try {
          const parsedTheme = JSON.parse(savedTheme);
          const themeToApply = { ...defaultUserTheme, ...parsedTheme };
          setLocalSettings(themeToApply);
          applyUserThemeColors(themeToApply);
          console.log('🎨 Applied initial theme from localStorage:', themeToApply);
        } catch (error) {
          console.error('Error parsing saved theme:', error);
          applyUserThemeColors(defaultUserTheme);
        }
      } else {
        console.log('🎨 INIT: No saved theme found, applying default');
        applyUserThemeColors(defaultUserTheme);
      }
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

  // Fetch user theme settings
  const { data: themeData, isLoading } = useQuery({
    queryKey: ['/api/user/theme-settings'],
    enabled: !!user && (user.role === 'transporter' || user.role === 'distributor' || user.role === 'warehouse' || user.role === 'office'),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false // Don't retry on failure
  });

  // Update theme when database data is available
  useEffect(() => {
    if (!authLoading && user && themeData && (user.role === 'transporter' || user.role === 'distributor' || user.role === 'warehouse' || user.role === 'office')) {
      const themeToApply = { ...defaultUserTheme, ...themeData };
      console.log('🎨 Updated theme from database:', themeData);
      
      setLocalSettings(themeToApply);
      applyUserThemeColors(themeToApply);
      
      // Save to localStorage for next session
      try {
        localStorage.setItem(`userTheme_${user.id}`, JSON.stringify(themeToApply));
        console.log('🎨 SAVED to localStorage:', `userTheme_${user.id}`, themeToApply);
        
        // Verify it was saved
        const saved = localStorage.getItem(`userTheme_${user.id}`);
        console.log('🎨 VERIFIED localStorage save:', saved);
      } catch (error) {
        console.error('❌ Failed to save theme to localStorage:', error);
      }
    }
  }, [themeData, user, authLoading]);

  // Apply default theme only for non-user roles (admin, etc.)
  useEffect(() => {
    if (user && !['transporter', 'distributor', 'warehouse', 'office'].includes(user.role || '')) {
      applyUserThemeColors(defaultUserTheme);
    }
  }, [user?.role]);

  const updateTheme = async (newSettings: Partial<UserThemeSettings>) => {
    if (!user) return;
    
    const updatedSettings = { ...localSettings, ...newSettings };
    
    // Apply theme immediately for instant feedback
    setLocalSettings(updatedSettings);
    applyUserThemeColors(updatedSettings);
    
    // Save to localStorage immediately
    localStorage.setItem(`userTheme_${user.id}`, JSON.stringify(updatedSettings));
    
    try {
      const response = await fetch('/api/user/theme-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedSettings)
      });
      
      if (response.ok) {
        const savedSettings = await response.json();
        // Update localStorage with server response
        localStorage.setItem(`userTheme_${user.id}`, JSON.stringify(savedSettings));
        
        // Invalidate cache to refetch
        queryClient.invalidateQueries({ queryKey: ['/api/user/theme-settings'] });
      }
    } catch (error) {
      console.error('Failed to update user theme:', error);
      // Revert to previous state on error
      setLocalSettings(localSettings);
      applyUserThemeColors(localSettings);
      localStorage.setItem(`userTheme_${user.id}`, JSON.stringify(localSettings));
    }
  };

  const value: UserThemeContextType = {
    themeSettings: localSettings,
    updateTheme,
    isLoading: isLoading || authLoading
  };

  return (
    <UserThemeContext.Provider value={value}>
      {children}
    </UserThemeContext.Provider>
  );
}

export function useUserTheme() {
  const context = useContext(UserThemeContext);
  if (context === undefined) {
    throw new Error('useUserTheme must be used within a UserThemeProvider');
  }
  return context;
}