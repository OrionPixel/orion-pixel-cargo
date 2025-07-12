// RealtimeColors Theme System
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const defaultTheme: ThemeColors = {
  primary: '#8427d7',
  secondary: '#e8deff', 
  accent: '#6d1fb8'
};

// RealtimeColors architecture - generates semantic color system
export function generateRealtimeColorSystem(colors: ThemeColors) {
  const primaryScale = generateColorScale(colors.primary);
  const secondaryScale = generateColorScale(colors.secondary);
  const accentScale = generateColorScale(colors.accent);
  
  // Generate semantic colors based on RealtimeColors 60/30/10 system
  const backgroundColor = '#fbfbfe'; // Very light background  
  const surfaceColor = '#ffffff'; // Pure white for surface
  const textPrimary = '#1a1a1a'; // Dark text for readability
  const textSecondary = '#6b7280'; // Neutral gray for secondary text
  
  return {
    '--color-primary-100': primaryScale[100],
    '--color-primary-200': primaryScale[200],
    '--color-primary-300': primaryScale[300],
    '--color-primary-400': primaryScale[400],
    '--color-primary-500': primaryScale[500],
    '--color-primary-600': primaryScale[600],
    '--color-primary-700': primaryScale[700],
    
    '--color-secondary-100': secondaryScale[100],
    '--color-secondary-200': secondaryScale[200],
    '--color-secondary-300': secondaryScale[300],
    '--color-secondary-400': secondaryScale[400],
    '--color-secondary-500': secondaryScale[500],
    '--color-secondary-600': secondaryScale[600],
    '--color-secondary-700': secondaryScale[700],
    
    '--color-accent-100': accentScale[100],
    '--color-accent-200': accentScale[200],
    '--color-accent-300': accentScale[300],
    '--color-accent-400': accentScale[400],
    '--color-accent-500': accentScale[500],
    '--color-accent-600': accentScale[600],
    '--color-accent-700': accentScale[700],
    
    // Semantic colors
    '--color-background': backgroundColor,
    '--color-surface': surfaceColor,
    '--color-text-primary': textPrimary,
    '--color-text-secondary': textSecondary,
    '--color-border': '#e5e7eb',
  };
}

export function generateColorScale(baseColor: string) {
  // Convert hex to HSL for manipulation
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
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
  
  // Generate scale
  return {
    100: hslToHex(h * 360, s * 100, Math.min(95, l * 100 + 40)),
    200: hslToHex(h * 360, s * 100, Math.min(90, l * 100 + 30)),
    300: hslToHex(h * 360, s * 100, Math.min(80, l * 100 + 20)),
    400: hslToHex(h * 360, s * 100, Math.min(70, l * 100 + 10)),
    500: baseColor,
    600: hslToHex(h * 360, s * 100, Math.max(30, l * 100 - 10)),
    700: hslToHex(h * 360, s * 100, Math.max(20, l * 100 - 20)),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function applyTheme(colors: ThemeColors) {
  const root = document.documentElement;
  
  // Generate the complete RealtimeColors system
  const colorSystem = generateRealtimeColorSystem(colors);
  
  // Apply all CSS variables
  Object.entries(colorSystem).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

export function adjustLightness(hex: string, amount: number): string {
  // Convert hex to HSL
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;
  
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
  
  // Adjust lightness
  l = Math.max(0, Math.min(1, amount / 100));
  
  return hslToHex(h * 360, s * 100, l * 100);
}

// Get current theme from localStorage or return default
export const getCurrentTheme = (): ThemeColors => {
  try {
    const saved = localStorage.getItem('cargoflow-theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        primary: parsed.primary || defaultTheme.primary,
        secondary: parsed.secondary || defaultTheme.secondary,
        accent: parsed.accent || defaultTheme.accent
      };
    }
  } catch (error) {
    console.warn('Failed to parse saved theme');
  }
  return defaultTheme;
};

// Store theme in localStorage
export const storeTheme = (theme: ThemeColors): void => {
  try {
    localStorage.setItem('cargoflow-theme', JSON.stringify(theme));
  } catch (error) {
    console.warn('Failed to store theme');
  }
};

// Initialize theme on app start
export const initializeTheme = (): ThemeColors => {
  const theme = getCurrentTheme();
  applyTheme(theme);
  return theme;
};