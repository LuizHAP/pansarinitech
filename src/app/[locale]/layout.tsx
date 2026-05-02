// src/app/[locale]/layout.tsx — owns <html lang> per-locale (Phase 2 Wave 1, D-CONTEXT mechanism)
// D-24 setRequestLocale in EVERY [locale] file.
//
// htmlLang derivation: locale === 'pt' ? 'pt-BR' : 'en'. BR-Portuguese is the variant Luiz
// authors; 'en' is generic. Lifts Lighthouse Accessibility 0.95 → 1.0 (resolves Phase 1
// deferred-item).
//
// Toaster + Analytics + SpeedInsights wiring is staged across Tasks 2 and 3 of Plan 02-01.
// They are imported and rendered here once the corresponding packages/components land.
import { Header } from '@/components/shared/header';
import { SkipToContent } from '@/components/shared/skip-to-content';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { routing } from '@/i18n/routing';
import { aurebesh } from '@/lib/fonts';
// import { Toaster } from '@/components/ui/sonner'; // uncommented in Task 3 (sonner install)
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { MotionConfig } from 'motion/react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

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
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${aurebesh.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <NextIntlClientProvider messages={messages} locale={locale}>
              <SkipToContent />
              <Header />
              <main
                id="main-content"
                tabIndex={-1}
                className="scroll-mt-14 min-h-[calc(100vh-56px)]"
              >
                {children}
              </main>
              {/* <Toaster /> — uncommented in Task 3 (sonner install) */}
            </NextIntlClientProvider>
          </MotionConfig>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
