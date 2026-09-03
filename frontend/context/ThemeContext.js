import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const ThemeModeContext = createContext(null);
const STORAGE_KEY = 'phishion-theme';

function buildTheme(mode) {
  return createMuiTheme({
    palette: {
      type: mode,
      primary: { main: '#9c27b0' },
      background: mode === 'dark'
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f5f5f5', paper: '#ffffff' },
    },
  });
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);
    } catch (_) {
      /* localStorage unavailable */
    }
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (_) {
        /* ignore */
      }
      return next;
    });
  };

  const setThemeMode = (next) => {
    if (next !== 'dark' && next !== 'light') return;
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      /* ignore */
    }
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggle, setThemeMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) return { mode: 'light', toggle: () => {}, setThemeMode: () => {} };
  return ctx;
}
