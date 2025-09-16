import { createContext, useEffect, useState, ReactNode } from 'react';
import { ThemeConfiguration, ThemeName, ThemeContextType } from './types';
import { themes, availableThemes } from './configs';
import { injectCSSVariables, removeCSSVariables } from './tokens';

// Create theme context
export const ThemeProviderContext = createContext<ThemeContextType | null>(null);
export const CustomThemeProviderContext = createContext<ThemeContextType | null>(null);
export const ThemeContext = ThemeProviderContext; // For backward compatibility

// Local storage key for theme persistence
const THEME_STORAGE_KEY = 'sgs-theme-preference';

// Theme validation function
function validateTheme(themeName: string): themeName is ThemeName {
  return availableThemes.includes(themeName as ThemeName);
}

// Get initial theme from localStorage or system preference
function getInitialTheme(): ThemeName {
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
  return 'default';
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    return defaultTheme || getInitialTheme();
  });

  const [theme, setThemeConfig] = useState<ThemeConfiguration>(() => {
    return themes[currentTheme];
  });

  // Update theme configuration when current theme changes
  useEffect(() => {
    const newTheme = themes[currentTheme];
    if (newTheme) {
      setThemeConfig(newTheme);
      // Inject CSS variables (both custom and shadcn/ui)
      removeCSSVariables();
      injectCSSVariables(newTheme);
      // Persist theme preference
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    }
  }, [currentTheme]);

  // Handle system theme preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!storedTheme) {
        setCurrentTheme(e.matches ? 'dark' : 'default');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Theme switching function with validation
  const setTheme = (themeName: ThemeName) => {
    if (!validateTheme(themeName)) {
      console.error(`Invalid theme: ${themeName}. Available themes:`, availableThemes);
      return;
    }

    if (themeName === currentTheme) {
      return; // No change needed
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