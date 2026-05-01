import { routing } from '@/i18n/routing';
// src/app/[locale]/layout.tsx — D-24 setRequestLocale in EVERY [locale] file
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

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <MotionConfig reducedMotion="user">
        {/* Plan 02 will insert <SkipToContent /> and <Header /> here */}
        <main id="main-content" tabIndex={-1} className="scroll-mt-14 min-h-screen">
          {children}
        </main>
      </MotionConfig>
    </NextIntlClientProvider>
  );
}
