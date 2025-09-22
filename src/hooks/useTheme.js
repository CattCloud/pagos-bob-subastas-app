import { useEffect, useState } from 'react';

function getInitialIsDark() {
  try {
    const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    // Por defecto: seguir preferencia del sistema
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } catch {
    // ignore
  }
  return false;
}

function applyTheme(isDark) {
  try {
    document.documentElement.classList.toggle('dark', isDark);
  } catch {
    // ignore
  }
}

export default function useTheme() {
  const [isDark, setIsDark] = useState(getInitialIsDark);

  // Sincroniza clase y persistencia
  useEffect(() => {
    applyTheme(isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Responder a cambios del SO solo si no hay preferencia guardada
  useEffect(() => {
    let mql;
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return; // el usuario ya eligió explícitamente
      if (window.matchMedia) {
        mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setIsDark(e.matches);
        mql.addEventListener ? mql.addEventListener('change', handler) : mql.addListener(handler);
        return () => {
          mql.removeEventListener ? mql.removeEventListener('change', handler) : mql.removeListener(handler);
        };
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => setIsDark((v) => !v);
  const setTheme = (theme) => setIsDark(theme === 'dark');

  return {
    isDark,
    theme: isDark ? 'dark' : 'light',
    toggleTheme,
    setTheme,
  };
}