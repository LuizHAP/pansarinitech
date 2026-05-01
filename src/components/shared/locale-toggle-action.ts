// src/components/shared/locale-toggle-action.ts
// Server action: validates target locale, sets NEXT_LOCALE cookie, redirects to /{target}{stripped-path}.
// D-01 / D-02 cookie persistence + D-03 path-preserving locale switch.
'use server';
import { type Locale, routing } from '@/i18n/routing';
import { redirect } from '@/lib/i18n/navigation';
import { cookies, headers } from 'next/headers';

export async function switchLocale(target: Locale) {
  // Defense in depth: validate target against allowlist even though TS narrows.
  // (T-02-01 mitigation — server-side validation regardless of compile-time narrowing.)
  if (!(routing.locales as readonly string[]).includes(target)) {
    throw new Error('Invalid locale');
  }

  const c = await cookies();
  const h = await headers();

  // Persist explicit choice (D-01, D-02 — 1-year cookie, matches routing.ts localeCookie config).
  c.set('NEXT_LOCALE', target, {
    maxAge: 60 * 60 * 24 * 365,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  // Compute equivalent path in target locale (D-03 path-preserving).
  // Strategy: read referer to find the current pathname, strip the leading /en or /pt segment,
  // then let next-intl's locale-aware redirect re-prefix with the target locale.
  // T-02-02 mitigation: validate referer against same-origin to prevent open-redirect via crafted referer.
  const referer = h.get('referer');
  let pathname = '/';
  if (referer) {
    try {
      const refUrl = new URL(referer);
      const hostHeader = h.get('host');
      if (hostHeader && refUrl.host === hostHeader) {
        pathname = refUrl.pathname || '/';
      }
    } catch {
      pathname = '/';
    }
  }
  const stripped = pathname.replace(/^\/(en|pt)(?=\/|$)/, '') || '/';

  redirect({ href: stripped, locale: target });
}
