// src/app/[locale]/[...rest]/page.tsx
//
// Catch-all under the locale segment. Any URL of the form `/{locale}/<anything not
// matched by a more specific route>` lands here and immediately calls notFound(),
// which triggers the locale-aware `[locale]/not-found.tsx` boundary — so /pt/foo
// renders the PT 404 and /en/bar renders the EN 404. Without this, Next would fall
// back to root `app/not-found.tsx` (English-only edge-case page).
//
// `setRequestLocale(locale)` is called even though notFound() short-circuits the render,
// so the [locale]/not-found.tsx boundary that Next invokes next sees the correct locale
// in `getLocale()` / `getTranslations()`.
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default async function LocaleCatchAll({
  params,
}: {
  params: Promise<{ locale: 'en' | 'pt'; rest: string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
