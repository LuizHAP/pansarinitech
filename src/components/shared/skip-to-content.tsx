// src/components/shared/skip-to-content.tsx
// First focusable element on every page (UX-03, D-21).
// Visually hidden at rest; visible when focused (Tailwind sr-only utility).
import { useTranslations } from 'next-intl';

export function SkipToContent() {
  const t = useTranslations('a11y');
  return (
    <a
      href="#main-content"
      className="sr-only font-mono text-sm font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2.5 focus:text-paper"
    >
      {t('skipToContent')}
    </a>
  );
}
