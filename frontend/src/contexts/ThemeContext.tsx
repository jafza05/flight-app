import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  Theme,
  ThemeId,
  ThemeMode,
  ThemeFamily,
  ThemeContextType
} from '../themes/types';
import { getTheme, getThemeByFamily } from '../themes/index';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'flight-tracker-theme-mode';
const THEME_FAMILY_KEY = 'flight-tracker-theme-family';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [themeFamily, setThemeFamilyState] = useState<ThemeFamily>('cockpit');
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme('cockpit-dark'));

  // Detect system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Determine effective theme mode
  const getEffectiveMode = (mode: ThemeMode): 'light' | 'dark' => {
    return mode === 'system' ? getSystemTheme() : mode;
  };

  // Update theme
  const updateTheme = (family: ThemeFamily, mode: ThemeMode) => {
    const effectiveMode = getEffectiveMode(mode);
    const theme = getThemeByFamily(family, effectiveMode);
    setCurrentTheme(theme);

    // Update HTML attributes for CSS
    document.documentElement.dataset.themeFamily = family;
    document.documentElement.dataset.themeMode = effectiveMode;
    document.documentElement.dataset.themeId = theme.id;
  };

  // Initialize theme from localStorage or defaults
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    const savedFamily = localStorage.getItem(THEME_FAMILY_KEY) as ThemeFamily | null;

    const initialMode = savedMode || 'dark'; // Default to dark
    const initialFamily = savedFamily || 'cockpit'; // Default to cockpit

    setThemeModeState(initialMode);
    setThemeFamilyState(initialFamily);
    updateTheme(initialFamily, initialMode);

    // Listen for system theme changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (initialMode === 'system') {
        updateTheme(initialFamily, 'system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_MODE_KEY, mode);
    updateTheme(themeFamily, mode);
  };

  const setThemeFamily = (family: ThemeFamily) => {
    setThemeFamilyState(family);
    localStorage.setItem(THEME_FAMILY_KEY, family);
    updateTheme(family, themeMode);
  };

  const setTheme = (themeId: ThemeId) => {
    const theme = getTheme(themeId);
    setThemeFamilyState(theme.family);
    setThemeModeState(theme.mode);
    localStorage.setItem(THEME_FAMILY_KEY, theme.family);
    localStorage.setItem(THEME_MODE_KEY, theme.mode);
    updateTheme(theme.family, theme.mode);
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    themeFamily,
    setThemeMode,
    setThemeFamily,
    setTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
