// src/app/not-found.tsx — ROOT (no [locale] segment)
//
// Why static (no cookie/Accept-Language sniffing):
//   Reading cookies() or headers() here forces the entire app into dynamic rendering
//   (Next 16 propagates dynamic context from root not-found.tsx to all sibling routes,
//   making /[locale] go from ● SSG to ƒ Dynamic — which violates I18N-06).
//
// What this does:
//   Renders a static, English-only 404. The /en/* and /pt/* unmatched routes are NOT
//   served by this file — they fall through to `[locale]/not-found.tsx` which has full
//   locale awareness. This file fires only for proxy-excluded paths
//   (api/_next/static/files-with-extension), which are programmatic edge cases that
//   don't benefit from PT translation.
//
// Linking back to home: hardcoded `/en` (the defaultLocale, D-04), as a plain <a> to avoid
// pulling in client-side locale-aware routing on this static fallback.
import { bricolage, plexMono } from '@/lib/fonts';

export default function RootNotFound() {
  return (
    <html lang="en" className={`site ${bricolage.variable} ${plexMono.variable}`}>
      <body>
        <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col items-start justify-center px-4 py-24 md:px-8">
          <p className="font-mono text-sm leading-relaxed text-ink-muted md:text-base">
            <span className="block text-paper">$ cd ~/missing-page</span>
            <span className="block">
              <span className="text-signal-soft">cd:</span> no such file or directory
            </span>
          </p>
          <h1 className="mt-8 font-display text-[clamp(96px,22vw,220px)] leading-[0.88] font-extrabold tracking-[-0.05em] text-paper">
            404
            <span aria-hidden="true" className="lp-cursor ml-2 h-[0.7em] w-[0.12em] bg-signal" />
          </h1>
          <a
            href="/en"
            className="mt-12 inline-flex rounded-[10px] bg-signal px-[26px] py-[18px] font-mono text-base font-semibold text-paper transition-[transform,background-color,color] hover:-translate-y-[3px] hover:bg-paper hover:text-ink"
          >
            Go back home
          </a>
        </main>
      </body>
    </html>
  );
}
