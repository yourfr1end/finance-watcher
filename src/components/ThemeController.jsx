import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore.js';

/** Keeps <html data-theme> and <meta name="theme-color"> in sync with settings and the OS. */
export function ThemeController() {
  const theme = useFinanceStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;

    const syncMeta = () => {
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    };
    syncMeta();

    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener('change', syncMeta);
    return () => media.removeEventListener('change', syncMeta);
  }, [theme]);

  return null;
}
