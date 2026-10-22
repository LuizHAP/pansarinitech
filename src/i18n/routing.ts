// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const LOCALE_COOKIE = {
  name: 'NEXT_LOCALE', // D-01
  maxAge: 60 * 60 * 24 * 365, // D-02 — 1 year
  secure: true,
  sameSite: 'lax',
} as const;

export const routing = defineRouting({
  locales: ['en', 'pt'] as const,
  defaultLocale: 'en', // D-04
  localePrefix: 'never',
  localeCookie: LOCALE_COOKIE,
});

export type Locale = (typeof routing.locales)[number];
