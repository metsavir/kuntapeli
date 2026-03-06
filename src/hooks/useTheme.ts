import { useState, useCallback } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'kuntapeli-theme';

function getTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
    setThemeState(t);
  }, []);

  return { theme, setTheme };
}
