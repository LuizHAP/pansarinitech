// src/proxy.ts — D-09 (Next 16 proxy file convention; lives in src/ when --src-dir is used)
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { LOCALE_COOKIE, type Locale, routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PT_COUNTRIES = new Set(['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL']);
const LEGACY_PREFIX = /^\/(en|pt)(?=\/|$)/;

const { name: COOKIE_NAME, ...cookieOptions } = LOCALE_COOKIE;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = pathname.match(LEGACY_PREFIX);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(legacy[0].length) || '/';
    const response = NextResponse.redirect(url, 308);
    response.cookies.set(COOKIE_NAME, legacy[1], { ...cookieOptions, path: '/' });
    return response;
  }

  // Vercel's geo header outranks Accept-Language; without it (local dev, CI)
  // next-intl falls back to Accept-Language.
  const country = request.headers.get('x-vercel-ip-country');
  let geoLocale: Locale | undefined;
  if (!request.cookies.has(COOKIE_NAME) && country) {
    geoLocale = PT_COUNTRIES.has(country.toUpperCase()) ? 'pt' : 'en';
    request.cookies.set(COOKIE_NAME, geoLocale);
  }

  const response = handleI18nRouting(request);
  if (geoLocale) {
    response.cookies.set(COOKIE_NAME, geoLocale, { ...cookieOptions, path: '/' });
  }
  return response;
}

export const config = {
  // D-09: exclude api, static, image-optim, files-with-extensions
  // Phase 4 (Plan 04-03): also exclude top-level Route Handlers without
  // file extensions — `icon`, `apple-icon` (Next 16 emits them at extension-less
  // paths but serves PNG content). Without this exemption next-intl's middleware
  // 307-redirects them to /en/icon, /en/apple-icon → 404. T-04-32.
  // preview, client-previews and admin live outside [locale], so next-intl would redirect them
  // to /en/...; directory-style /client-previews/x/ URLs have no dot for the extension rule.
  // Next emits og:image URLs with the internal /{locale}/ segment, so those must not be
  // redirected to the unprefixed path.
  matcher: [
    '/((?!api|_next/static|_next/image|icon|apple-icon|preview|client-previews|admin|.*opengraph-image|.*\\..*).*)',
  ],
};
