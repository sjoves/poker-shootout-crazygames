import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 'lucky-green' | 'acid-green';

interface Theme {
  id: ThemeName;
  name: string;
}

export const THEMES: Theme[] = [
  { id: 'lucky-green', name: 'Lucky Green' },
  { id: 'acid-green', name: 'Acid Green' },
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
    root.classList.remove('theme-acid-green');
    
    // Apply the selected theme class (lucky-green is default, no class needed)
    if (theme === 'acid-green') {
      root.classList.add('theme-acid-green');
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
