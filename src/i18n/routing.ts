// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt'] as const,
  defaultLocale: 'en', // D-04
  localePrefix: 'never',
  localeCookie: {
    name: 'NEXT_LOCALE', // D-01
    maxAge: 60 * 60 * 24 * 365, // D-02 — 1 year
    secure: true,
    sameSite: 'lax',
  },
});

export type Locale = (typeof routing.locales)[number];
