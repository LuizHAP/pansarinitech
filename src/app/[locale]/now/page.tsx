import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { now } from '@/data/now';
import type { Locale } from '@/i18n/routing';
import { formatLongDate, pickLocale } from '@/lib/i18n/helpers';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
// src/app/[locale]/now/page.tsx — NOW-01, NOW-02
//
// Three subsections (workingOn / reading / side) + prominent <time dateTime>
// machine-readable lastUpdated.
//
// CRITICAL (Phase 1 D-24): setRequestLocale(locale) is the FIRST call so this
// route remains ● SSG. scripts/check-static-rendering.mjs rejects ƒ /[locale]/now.
// No cookies()/headers()/draftMode() anywhere in the tree below.
//
// <time dateTime={...}> uses camelCase — JSX silently ignores lowercase `datetime`
// (Phase 2 RESEARCH Pitfall #7). The lowercase attribute is what the browser
// actually emits to the DOM (rendered as `datetime="..."`), but you must write
// it as `dateTime` in JSX.
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'now' });
  return buildMetadata({
    locale,
    path: '/now',
    title: t('title'),
    description: t('pageDescription'),
  });
}

export default async function NowPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('now');
  const formattedDate = formatLongDate(now.lastUpdated, locale);

  const sections = [
    { key: 'workingOn' as const, title: t('workingOn'), body: pickLocale(now.workingOn, locale) },
    { key: 'reading' as const, title: t('reading'), body: pickLocale(now.reading, locale) },
    { key: 'side' as const, title: t('side'), body: pickLocale(now.side, locale) },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          <time dateTime={now.lastUpdated}>
            {t('lastUpdated')}: {formattedDate}
          </time>
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {sections.map((s) => (
          <Card key={s.key}>
            <CardHeader>
              <CardTitle className="text-lg">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-muted-foreground">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </article>
  );
}
