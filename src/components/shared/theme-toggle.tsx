// src/components/shared/theme-toggle.tsx
// Sun/Moon CSS-only swap (Pitfall 2 Pattern A — no hydration risk).
// Invariant aria-label, aria-pressed reflects dark state (THEME-05, Pitfall 9).
'use client';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('themeToggle');
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t('label')}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-11 w-11"
    >
      <Sun className="h-5 w-5 block dark:hidden" aria-hidden="true" />
      <Moon className="h-5 w-5 hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
