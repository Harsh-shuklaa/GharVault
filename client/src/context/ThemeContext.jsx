import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  darkStyle: 'midnight',
  isMidnight: true,
  isObsidian: false,
  setDarkStyle: () => {},
  accentColor: 'emerald',
  isBlue: false,
  toggleAccentColor: () => {},
  setAccentColor: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('gharvault_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      // Fallback
    }
    // Default to Dark Mode as specified
    return 'dark';
  });

  const [darkStyle, setDarkStyleState] = useState(() => {
    try {
      const saved = localStorage.getItem('gharvault_dark_style');
      if (saved === 'obsidian' || saved === 'midnight') {
        return saved;
      }
    } catch (e) {
      // Fallback
    }
    // Default dark style
    return 'midnight';
  });

  const [accentColor, setAccentColorState] = useState(() => {
    try {
      const savedAccent = localStorage.getItem('gharvault_accent');
      if (savedAccent === 'emerald' || savedAccent === 'blue') {
        return savedAccent;
      }
    } catch (e) {
      // Fallback
    }
    return 'emerald';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-dark-style', darkStyle);
    root.classList.remove('dark-obsidian', 'dark-midnight');
    if (theme === 'dark') {
      root.classList.add(darkStyle === 'obsidian' ? 'dark-obsidian' : 'dark-midnight');
    }
    try {
      localStorage.setItem('gharvault_theme', theme);
      localStorage.setItem('gharvault_dark_style', darkStyle);
    } catch (e) {
      // Ignore
    }
  }, [theme, darkStyle]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accentColor);
    root.classList.remove('theme-emerald', 'theme-blue');
    root.classList.add(accentColor === 'blue' ? 'theme-blue' : 'theme-emerald');
    try {
      localStorage.setItem('gharvault_accent', accentColor);
    } catch (e) {
      // Ignore
    }

    // Dynamic Live Favicon Switcher based on Active Theme
    const favicon = document.getElementById('app-favicon') || document.querySelector("link[rel*='icon']");
    if (favicon) {
      favicon.href = accentColor === 'blue' ? '/favicon-blue.svg' : '/favicon-emerald.svg';
    }

    // Dynamic Theme Color for Mobile Browser Address Bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', accentColor === 'blue' ? '#2563EB' : '#10B981');
    }
  }, [accentColor]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const setDarkStyle = (newStyle) => {
    if (newStyle === 'obsidian' || newStyle === 'midnight') {
      setDarkStyleState(newStyle);
    }
  };

  const toggleAccentColor = () => {
    setAccentColorState(prev => (prev === 'emerald' ? 'blue' : 'emerald'));
  };

  const setAccentColor = (newAccent) => {
    if (newAccent === 'emerald' || newAccent === 'blue') {
      setAccentColorState(newAccent);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        darkStyle,
        isMidnight: theme === 'dark' && darkStyle === 'midnight',
        isObsidian: theme === 'dark' && darkStyle === 'obsidian',
        setDarkStyle,
        accentColor,
        isBlue: accentColor === 'blue',
        toggleAccentColor,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
