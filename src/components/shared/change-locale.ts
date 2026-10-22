import { LOCALE_COOKIE, type Locale } from '@/i18n/routing';

// Both locales share one URL, so a client-side navigation can be served from router
// cache entries prefetched in the old locale. A full reload drops that cache.
export function changeLocale(target: Locale) {
  const { name, maxAge, sameSite, secure } = LOCALE_COOKIE;
  document.cookie = `${name}=${target}; path=/; max-age=${maxAge}; samesite=${sameSite}${secure ? '; secure' : ''}`;
  window.location.reload();
}
