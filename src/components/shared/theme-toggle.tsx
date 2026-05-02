// src/components/shared/theme-toggle.tsx
// Phase 5 — View Transitions wrapper around setTheme (CONTEXT D-01..D-05).
//
// Click-coord-driven radial reveal on supporting browsers; instant swap on
// older browsers; explicit opacity-fade on prefers-reduced-motion (CSS-side
// in src/app/globals.css). The CSS fallback covers reduced-motion visually,
// but we ALSO bypass startViewTransition entirely at the JS layer for RM —
// avoids spinning up the snapshot machinery for a 200ms fade.
//
// Sun/Moon CSS-only swap (Pitfall 2 Pattern A — no hydration risk).
// Invariant aria-label, aria-pressed reflects dark state (THEME-05, Pitfall 9).
'use client';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { MouseEvent } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('themeToggle');
  const isDark = resolvedTheme === 'dark';

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark';

    // Feature-detect (Safari <18 / Firefox <144 / older Chromium) AND
    // bypass on prefers-reduced-motion (CSS handles the visual fade; we
    // skip the snapshot machinery to honor "reduce" intent at the JS layer).
    if (
      typeof document === 'undefined' ||
      !('startViewTransition' in document) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTheme(next);
      return;
    }

    // Click-coord capture with keyboard fallback.
    // Keyboard activation (Enter/Space) sends clientX:0/clientY:0; the
    // getBoundingClientRect fallback computes button center so the radial
    // reveal originates from the toggle, not the viewport top-left
    // (RESEARCH §Pitfall 5).
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    document.documentElement.style.setProperty('--vt-x', `${x}px`);
    document.documentElement.style.setProperty('--vt-y', `${y}px`);

    // setTheme is synchronous (next-themes writes attribute + localStorage
    // in one tick — RESEARCH §Assumption A1, verified). startViewTransition
    // takes the OLD snapshot, runs the callback, then animates to NEW.
    document.startViewTransition(() => {
      setTheme(next);
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t('label')}
      aria-pressed={isDark}
      onClick={onClick}
      className="h-11 w-11"
    >
      <Sun className="h-5 w-5 block dark:hidden" aria-hidden="true" />
      <Moon className="h-5 w-5 hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
