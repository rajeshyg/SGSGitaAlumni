import { createContext, useEffect, useState, ReactNode } from 'react';
import { ThemeConfiguration, ThemeName, ThemeContextType } from './types';
import { themes, availableThemes } from './configs';
import { injectCSSVariables, removeCSSVariables } from './tokens';

// Create theme context
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeProviderContext = createContext<ThemeContextType | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const CustomThemeProviderContext = createContext<ThemeContextType | null>(null);
export const ThemeContext = ThemeProviderContext; // For backward compatibility

// Local storage key for theme persistence
const THEME_STORAGE_KEY = 'sgs-theme-preference';

// Theme validation function
function validateTheme(themeName: string): themeName is ThemeName {
  return availableThemes.includes(themeName as ThemeName);
}

// Get initial theme from localStorage or system preference
function getInitialTheme(defaultTheme?: ThemeName): ThemeName {
  // If defaultTheme is provided and it's 'dark', prioritize it
  if (defaultTheme === 'dark') {
    return 'dark';
  }

  // Check localStorage first
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme && validateTheme(storedTheme)) {
    return storedTheme as ThemeName;
  }

  // Check system preference for dark mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      return 'dark';
    }
  }

  // Default to default theme
  return defaultTheme || 'default';
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

function useThemeState(defaultTheme?: ThemeName) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    return getInitialTheme(defaultTheme);
  });

  const [theme, setThemeConfig] = useState<ThemeConfiguration>(() => {
    return themes[currentTheme];
  });

  return { currentTheme, setCurrentTheme, theme, setThemeConfig };
}

function useThemeEffects(
  currentTheme: ThemeName,
  setCurrentTheme: (theme: ThemeName) => void,
  setThemeConfig: (config: ThemeConfiguration) => void
) {
  // Update theme configuration when current theme changes
  useEffect(() => {
    const newTheme = themes[currentTheme];
    if (newTheme) {
      setThemeConfig(newTheme);
      removeCSSVariables();
      injectCSSVariables(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    }
  }, [currentTheme, setThemeConfig]);

  // Handle system theme preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!storedTheme) {
        setCurrentTheme(e.matches ? 'dark' : 'default');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setCurrentTheme]);
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const { currentTheme, setCurrentTheme, theme, setThemeConfig } = useThemeState(defaultTheme);

  useThemeEffects(currentTheme, setCurrentTheme, setThemeConfig);

  // Theme switching function with validation
  const setTheme = (themeName: ThemeName) => {
    if (!validateTheme(themeName)) {
      return;
    }

    if (themeName === currentTheme) {
      return;
    }

    setCurrentTheme(themeName);
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    theme,
    setTheme,
    availableThemes,
  };

  return (
    <ThemeProviderContext.Provider value={contextValue}>
      <CustomThemeProviderContext.Provider value={contextValue}>
        {children}
      </CustomThemeProviderContext.Provider>
    </ThemeProviderContext.Provider>
  );
}

// Export ThemeProvider as default for App.tsx
export default ThemeProvider;