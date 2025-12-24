import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 'lucky-green' | 'raiders';

interface Theme {
  id: ThemeName;
  name: string;
  description: string;
}

export const THEMES: Theme[] = [
  { id: 'lucky-green', name: 'Lucky Green', description: 'Emerald & mint casino theme' },
  { id: 'raiders', name: 'Raiders', description: 'Black & silver theme' },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'poker-shootout-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'lucky-green';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-raiders');
    
    // Apply the selected theme class (lucky-green is default, no class needed)
    if (theme === 'raiders') {
      root.classList.add('theme-raiders');
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
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
