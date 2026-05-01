// src/app/not-found.tsx — ROOT (no [locale] segment)
//
// Why static (no cookie/Accept-Language sniffing):
//   Reading cookies() or headers() here forces the entire app into dynamic rendering
//   (Next 16 propagates dynamic context from root not-found.tsx to all sibling routes,
//   making /[locale] go from ● SSG to ƒ Dynamic — which violates I18N-06).
//
// What this does:
//   Renders a static, English-only 404 with the SW reference and Aurebesh accent. The
//   /en/* and /pt/* unmatched routes are NOT served by this file — they fall through
//   to `[locale]/not-found.tsx` which has full locale awareness. This file fires only
//   for proxy-excluded paths (api/_next/static/files-with-extension), which are
//   programmatic edge cases that don't benefit from PT translation.
//
// Linking back to home: hardcoded `/en` (the defaultLocale, D-04). Users who land here
// can use the standard navigation to switch locale once they hit a routed page.
import { Button } from '@/components/ui/button';
import { aurebesh } from '@/lib/fonts';

export default function RootNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <section className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-24 text-center">
          {/* Layer 1: Numeric 404 — display heading, h1 */}
          <h1 className="text-[clamp(72px,20vw,96px)] font-bold leading-none">404</h1>

          {/* Layer 2: Aurebesh decorative accent — aria-hidden + sr-only fallback (A11Y-07) */}
          <span
            aria-hidden="true"
            className={`pb-2 pt-2 text-2xl text-muted-foreground ${aurebesh.className}`}
            style={{ fontFamily: 'var(--font-aurebesh)' }}
          >
            404
          </span>
          <span className="sr-only">404 in Aurebesh</span>

          {/* Layer 3: SW reference body line — English (root edge cases only) */}
          <p className="mt-4 text-base">These aren&apos;t the pages you&apos;re looking for.</p>

          {/* Layer 4: CTA Button — hardcoded to defaultLocale home (D-04 = 'en'). Use a plain
              <a> to avoid pulling in client-side locale-aware routing on this static fallback. */}
          <Button asChild className="mt-8">
            <a href="/en">Go back home</a>
          </Button>
        </section>
      </body>
    </html>
  );
}
