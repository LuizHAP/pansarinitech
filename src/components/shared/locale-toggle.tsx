'use client';
import type { Locale } from '@/i18n/routing';
// src/components/shared/locale-toggle.tsx
// PT/EN text-label toggle (UI-SPEC §"Locale Toggle Specification"; D-03 path-preserving).
// Client component per RESEARCH.md §12 — useLocale + useTranslations are next-intl client APIs
// that auto-bridge through NextIntlClientProvider in [locale]/layout.tsx.
import { useLocale, useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';
import { changeLocale } from './change-locale';
import { switchLocale } from './locale-toggle-action';

export function LocaleToggle() {
  const current = useLocale();
  const t = useTranslations('localeToggle');

  // 44px touch targets (WCAG 2.5.5) via h-11 + min-w-[44px].
  const baseBtn =
    'inline-flex h-11 min-w-[44px] items-center justify-center rounded-md px-2 font-mono text-sm transition-colors';
  const activeCls =
    'font-semibold text-foreground underline decoration-signal-soft underline-offset-4';
  const inactiveCls = 'text-muted-foreground hover:text-foreground';

  // Before hydration the server action form posts natively and the browser does a full
  // load. Once hydrated, onClick takes over so the switch also ends in a full reload.
  const onSwitch = (target: Locale) => (event: MouseEvent) => {
    event.preventDefault();
    changeLocale(target);
  };

  return (
    <form aria-label={t('label')} className="flex items-center">
      <button
        type="submit"
        formAction={switchLocale.bind(null, 'pt')}
        onClick={onSwitch('pt')}
        aria-current={current === 'pt' ? 'page' : undefined}
        className={`${baseBtn} ${current === 'pt' ? activeCls : inactiveCls}`}
      >
        PT
      </button>
      <span aria-hidden="true" className="font-mono text-sm text-muted-foreground">
        /
      </span>
      <button
        type="submit"
        formAction={switchLocale.bind(null, 'en')}
        onClick={onSwitch('en')}
        aria-current={current === 'en' ? 'page' : undefined}
        className={`${baseBtn} ${current === 'en' ? activeCls : inactiveCls}`}
      >
        EN
      </button>
    </form>
  );
}
