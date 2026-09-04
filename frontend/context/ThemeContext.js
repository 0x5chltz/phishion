import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const ThemeModeContext = createContext(null);
const STORAGE_KEY = 'phishion-theme';

const FONT_STACK = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const MONO_FONT_STACK = '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const PALETTES = {
  dark: {
    primary: { main: '#3B82F6', dark: '#2563EB', light: '#60A5FA', contrastText: '#FFFFFF' },
    secondary: { main: '#94A3B8', contrastText: '#0B1120' },
    error: { main: '#EF4444', dark: '#DC2626' },
    warning: { main: '#F59E0B', dark: '#D97706' },
    success: { main: '#22C55E', dark: '#16A34A' },
    info: { main: '#38BDF8', dark: '#0EA5E9' },
    background: { default: '#0B1120', paper: '#0F172A' },
    text: { primary: '#F1F5F9', secondary: '#94A3B8', disabled: '#475569' },
    divider: '#1E293B',
  },
  light: {
    primary: { main: '#2563EB', dark: '#1D4ED8', light: '#3B82F6', contrastText: '#FFFFFF' },
    secondary: { main: '#64748B', contrastText: '#FFFFFF' },
    error: { main: '#DC2626', dark: '#B91C1C' },
    warning: { main: '#D97706', dark: '#B45309' },
    success: { main: '#16A34A', dark: '#15803D' },
    info: { main: '#0284C7', dark: '#0369A1' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B', disabled: '#CBD5E1' },
    divider: '#E2E8F0',
  },
};

function buildTheme(mode) {
  const p = PALETTES[mode];
  const theme = createMuiTheme({
    palette: { type: mode, ...p },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: FONT_STACK,
      h1: { fontFamily: FONT_STACK, fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontFamily: FONT_STACK, fontWeight: 700, fontSize: '2rem', lineHeight: 1.25, letterSpacing: '-0.01em' },
      h3: { fontFamily: FONT_STACK, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3 },
      h4: { fontFamily: FONT_STACK, fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.35 },
      h5: { fontFamily: FONT_STACK, fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
      h6: { fontFamily: FONT_STACK, fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.55 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
      caption: { fontSize: '0.75rem', color: p.text.secondary },
    },
    shadows: mode === 'dark'
      ? [
          'none',
          '0 1px 2px 0 rgba(0,0,0,0.4)',
          '0 1px 3px 0 rgba(0,0,0,0.45)',
          ...Array(22).fill('0 4px 16px 0 rgba(0,0,0,0.5)'),
        ]
      : [
          'none',
          '0 1px 2px 0 rgba(15,23,42,0.06)',
          '0 1px 3px 0 rgba(15,23,42,0.08)',
          ...Array(22).fill('0 4px 16px 0 rgba(15,23,42,0.08)'),
        ],
  });

  theme.overrides = {
    MuiCssBaseline: {
      '@global': {
        html: { fontFamily: FONT_STACK },
        body: {
          backgroundColor: p.background.default,
          color: p.text.primary,
          transition: 'background-color 200ms ease',
        },
        '::selection': { backgroundColor: theme.palette.primary.main, color: '#fff' },
        code: { fontFamily: MONO_FONT_STACK },
        a: { color: theme.palette.primary.main },
      },
    },
    MuiPaper: {
      root: { backgroundColor: p.background.paper },
      rounded: { borderRadius: 14 },
      elevation1: { boxShadow: theme.shadows[1] },
    },
    MuiButton: {
      root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      containedPrimary: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
    },
    MuiChip: { root: { borderRadius: 8, fontWeight: 600 } },
    MuiDialog: { paper: { borderRadius: 14 } },
    MuiTextField: { root: { fontFamily: FONT_STACK } },
    MuiSelect: { root: { fontFamily: FONT_STACK } },
    MuiLinearProgress: { root: { borderRadius: 8, height: 6 } },
    MuiTableCell: { root: { borderColor: p.divider } },
  };

  return theme;
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState('dark');

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
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          }}
        >
          {children}
        </div>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) return { mode: 'dark', toggle: () => {}, setThemeMode: () => {} };
  return ctx;
}
