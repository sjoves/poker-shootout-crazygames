import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 'emerald' | 'pink' | 'blue' | 'purple';

interface Theme {
  id: ThemeName;
  name: string;
  logo: string;
}

import logoGreen from '@/assets/logo-green.png';
import logoPink from '@/assets/logo-pink.png';
import logoBlue from '@/assets/logo-blue.png';
import logoPurple from '@/assets/logo-purple.png';

export const THEMES: Theme[] = [
  { id: 'emerald', name: 'Emerald', logo: logoGreen },
  { id: 'pink', name: 'Pink', logo: logoPink },
  { id: 'blue', name: 'Blue', logo: logoBlue },
  { id: 'purple', name: 'Purple', logo: logoPurple },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: Theme[];
  currentLogo: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'poker-shootout-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    // Migration from old theme names
    if (stored === 'lucky-green' || stored === 'acid-green') {
      return 'emerald';
    }
    return (stored as ThemeName) || 'emerald';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-pink', 'theme-blue', 'theme-purple');
    
    // Apply the selected theme class (emerald is default, no class needed)
    if (theme !== 'emerald') {
      root.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  const currentLogo = THEMES.find(t => t.id === theme)?.logo || logoGreen;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentLogo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
