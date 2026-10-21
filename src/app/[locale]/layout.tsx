// src/app/[locale]/layout.tsx — owns <html lang> per-locale (Phase 2 Wave 1, D-CONTEXT mechanism)
// D-24 setRequestLocale in EVERY [locale] file.
//
// htmlLang derivation: locale === 'pt' ? 'pt-BR' : 'en'. BR-Portuguese is the variant Luiz
// authors; 'en' is generic. Lifts Lighthouse Accessibility 0.95 → 1.0 (resolves Phase 1
// deferred-item).
import { EasterEgg, Footer, Header, SkipToContent } from '@/components/shared';
import { Toaster } from '@/components/ui';
import { routing } from '@/i18n/routing';
import { bricolage, plexMono } from '@/lib/fonts';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { MotionConfig } from 'motion/react';
import type { Viewport } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const viewport: Viewport = { themeColor: '#0E0F0C' };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const htmlLang = locale === 'pt' ? 'pt-BR' : 'en';

  return (
    // suppressHydrationWarning: MotionToggle restores data-motion on <html> on the client.
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className={`site ${bricolage.variable} ${plexMono.variable}`}
    >
      <body>
        <MotionConfig reducedMotion="user">
          <NextIntlClientProvider messages={messages} locale={locale}>
            <SkipToContent />
            <Header />
            <main id="main-content" tabIndex={-1} className="scroll-mt-16 min-h-[calc(100vh-64px)]">
              {children}
            </main>
            <Footer />
            <Toaster theme="dark" />
            <EasterEgg />
          </NextIntlClientProvider>
        </MotionConfig>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
