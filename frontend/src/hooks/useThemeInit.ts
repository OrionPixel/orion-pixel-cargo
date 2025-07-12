import { useEffect } from 'react';
import { initializeTheme } from '@/lib/theme';

export function useThemeInit() {
  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();
  }, []);
}