import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ColorTheme {
  id: string;
  name: string;
  accent: string;       // HSL values, e.g. "40 60% 58%"
  secondary: string;    // HSL values, e.g. "168 100% 42%"
  accentHex: string;    // Accent HEX representation for icons or manual styling
  secondaryHex: string; // Secondary HEX representation
}

export const themes: ColorTheme[] = [
  {
    id: 'gold-teal',
    name: 'Gold & Teal',
    accent: '40 60% 58%',          // #D4A853 - Rich Gold
    secondary: '168 100% 42%',     // #00D4AA - Electric Teal
    accentHex: '#D4A853',
    secondaryHex: '#00D4AA'
  },
  {
    id: 'rose-emerald',
    name: 'Rose & Emerald',
    accent: '18 69% 65%',          // #E0A391 - Rose Gold
    secondary: '142 70% 45%',      // #22C55E - Emerald
    accentHex: '#E0A391',
    secondaryHex: '#22C55E'
  },
  {
    id: 'platinum-sapphire',
    name: 'Platinum & Sapphire',
    accent: '215 15% 75%',         // #BDC3C7 - Platinum
    secondary: '220 90% 56%',      // #3B82F6 - Sapphire
    accentHex: '#BDC3C7',
    secondaryHex: '#3B82F6'
  },
  {
    id: 'champagne-amethyst',
    name: 'Champagne & Amethyst',
    accent: '34 40% 70%',          // #F3E5AB - Champagne
    secondary: '270 70% 60%',      // #9F33FF - Amethyst
    accentHex: '#F3E5AB',
    secondaryHex: '#9F33FF'
  }
];

interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => void;
  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('rentease_color_theme');
    const matched = themes.find((t) => t.id === saved);
    return matched || themes[0];
  });

  const [themeMode, setThemeModeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('rentease_theme_mode') as 'dark' | 'light') || 'dark';
  });

  const setTheme = (themeId: string) => {
    const matched = themes.find((t) => t.id === themeId);
    if (matched) {
      setCurrentThemeState(matched);
      localStorage.setItem('rentease_color_theme', themeId);
      applyTheme(matched);
    }
  };

  const setThemeMode = (mode: 'dark' | 'light') => {
    setThemeModeState(mode);
    localStorage.setItem('rentease_theme_mode', mode);
  };

  const applyTheme = (theme: ColorTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--secondary', theme.secondary);
  };

  // Apply on mount
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Apply class on mount and toggle
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
