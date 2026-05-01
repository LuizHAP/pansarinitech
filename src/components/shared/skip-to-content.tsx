// src/components/shared/skip-to-content.tsx
// First focusable element on every page (UX-03, D-21).
// Visually hidden at rest; visible when focused (Tailwind sr-only utility).
import { useTranslations } from 'next-intl';

export function SkipToContent() {
  const t = useTranslations('a11y');
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-foreground"
    >
      {t('skipToContent')}
    </a>
  );
}
