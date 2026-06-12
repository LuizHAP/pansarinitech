// src/lib/i18n/helpers.ts — bilingual UX helpers (D-04)
// Located alongside navigation.ts so Phase 1's Biome override on src/lib/i18n/* covers it.
//
// pickLocale: tiny indexer used by every section component to read a {en, pt} field.
// formatDate / formatPeriod: Intl.DateTimeFormat-based formatters for the career timeline
//   and the Now page's <time> element. Locale string is sourced from the hard-coded
//   Locale literal type — never user input (T-02-2-02).
import type { Role } from '@/data/types';
import type { Locale } from '@/i18n/routing';

export function pickLocale<T>(field: { en: T; pt: T }, locale: Locale): T {
  return field[locale];
}

const monthFmt: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }),
  pt: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }),
};

const fullDateFmt: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  pt: new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }),
};

/**
 * Format a date as "Jan 2023" (en) / "jan. de 2023" (pt-BR).
 * Accepts:
 *   - YYYY-MM string (career period start/end shape)
 *   - YYYY-MM-DD string (now.lastUpdated shape)
 *   - Date object
 */
export function formatDate(date: string | Date, locale: Locale): string {
  let d: Date;
  if (typeof date === 'string') {
    if (date.length === 7) {
      // YYYY-MM → first day of month at UTC noon to dodge TZ shifts
      d = new Date(`${date}-01T12:00:00Z`);
    } else {
      d = new Date(`${date}T12:00:00Z`);
    }
  } else {
    d = date;
  }
  return monthFmt[locale].format(d);
}

/**
 * Format a full date as "May 2, 2026" (en) / "2 de maio de 2026" (pt-BR).
 * Used by the Now page's "Last updated:" line.
 */
export function formatLongDate(date: string | Date, locale: Locale): string {
  const d =
    typeof date === 'string'
      ? new Date(`${date.length === 7 ? `${date}-01` : date}T12:00:00Z`)
      : date;
  return fullDateFmt[locale].format(d);
}

const presentLabel: Record<Locale, string> = { en: 'Present', pt: 'Presente' };

export function formatPeriod(period: Role['period'], locale: Locale): string {
  const start = formatDate(period.start, locale);
  const end = period.end === 'present' ? presentLabel[locale] : formatDate(period.end, locale);
  return `${start} — ${end}`;
}
