import { type Locale, routing } from '@/i18n/routing';
import { redirect } from '@/lib/i18n/navigation';
// src/app/not-found.tsx — ROOT (no [locale] segment)
// Reads NEXT_LOCALE cookie + Accept-Language; redirects to /{locale}/not-found via the
// locale-aware redirect from @/lib/i18n/navigation (LOCKED — no fallback to next/navigation).
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { cookies, headers } from 'next/headers';

export default async function RootNotFound() {
  const c = await cookies();
  const h = await headers();

  // Resolve target locale: cookie precedence (D-01), then Accept-Language (D-04 fallback to defaultLocale).
  let detected: Locale;

  const cookieLocale = c.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)) {
    detected = cookieLocale as Locale;
  } else {
    const acceptLanguage = h.get('accept-language') ?? '';
    const negotiator = new Negotiator({
      headers: { 'accept-language': acceptLanguage },
    });
    const requested = negotiator.languages();
    detected = match(
      requested,
      routing.locales as unknown as string[],
      routing.defaultLocale,
    ) as Locale;
  }

  // Locale-aware typed redirect — next-intl prepends the locale prefix (e.g. /en/not-found, /pt/not-found).
  // The Biome `noRestrictedImports` rule blocks `next/link` and any future `next/navigation` rule
  // by name — this `redirect` import is from `@/lib/i18n/navigation`, which is exempt by override.
  redirect({ href: '/not-found', locale: detected });
}
