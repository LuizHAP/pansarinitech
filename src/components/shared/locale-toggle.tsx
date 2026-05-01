'use client';
// src/components/shared/locale-toggle.tsx
// PT/EN text-label toggle (UI-SPEC §"Locale Toggle Specification"; D-03 path-preserving).
// Client component per RESEARCH.md §12 — useLocale + useTranslations are next-intl client APIs
// that auto-bridge through NextIntlClientProvider in [locale]/layout.tsx.
import { useLocale, useTranslations } from 'next-intl';
import { switchLocale } from './locale-toggle-action';

export function LocaleToggle() {
  const current = useLocale();
  const t = useTranslations('localeToggle');

  // 44px touch targets (WCAG 2.5.5) via h-11 + min-w-[44px].
  const baseBtn = 'inline-flex h-11 min-w-[44px] items-center justify-center px-2 text-sm';
  const activeCls = 'font-semibold text-foreground underline decoration-primary';
  const inactiveCls = 'text-muted-foreground hover:text-foreground';

  return (
    <form aria-label={t('label')} className="flex items-center gap-1">
      <button
        type="submit"
        formAction={switchLocale.bind(null, 'pt')}
        aria-current={current === 'pt' ? 'page' : undefined}
        className={`${baseBtn} ${current === 'pt' ? activeCls : inactiveCls}`}
      >
        PT
      </button>
      <span aria-hidden="true" className="text-muted-foreground">
        /
      </span>
      <button
        type="submit"
        formAction={switchLocale.bind(null, 'en')}
        aria-current={current === 'en' ? 'page' : undefined}
        className={`${baseBtn} ${current === 'en' ? activeCls : inactiveCls}`}
      >
        EN
      </button>
    </form>
  );
}
