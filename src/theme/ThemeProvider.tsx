import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { getSetting, setSetting } from '../db/settingsRepo';
import { lightPalette, darkPalette, type Palette } from './colors';
import { spacing, radius, type, iconSize } from './tokens';

const KEY_MODE = 'theme.mode';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeValue {
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
  iconSize: typeof iconSize;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function isValidMode(raw: string | null): raw is ThemeMode {
  return raw === 'light' || raw === 'dark' || raw === 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load the stored preference once the database is ready
  useEffect(() => {
    let alive = true;
    getSetting(KEY_MODE)
      .then(raw => {
        if (alive && isValidMode(raw)) setModeState(raw);
      })
      .catch(() => {
        // Database not ready yet — 'system' is a fine default
      });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setSetting(KEY_MODE, next).catch(() => {
      // Not fatal — the choice just won't persist
    });
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      colors: isDark ? darkPalette : lightPalette,
      spacing,
      radius,
      type,
      iconSize,
      isDark,
      mode,
      setMode,
    }),
    [isDark, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return ctx;
}