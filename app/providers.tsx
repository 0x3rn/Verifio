'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeMode } from '@/lib/types';
import { initPostHog } from '@/lib/posthog';

// ---- Theme Context ----

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem('verifio-theme') as ThemeMode | null;
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      }
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    const themeColor = theme === 'dark' ? '#0b1120' : '#fcf8f3';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    localStorage.setItem('verifio-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---- PostHog Provider ----

function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}

// ---- Combined Provider ----

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeContextProvider>
        {children}
      </ThemeContextProvider>
    </PostHogProvider>
  );
}
