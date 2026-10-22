import JsonLd, { buildBreadcrumbList } from '@/components/json-ld';
import { SectionHead } from '@/components/site';
import { Section, sectionContainer } from '@/components/ui';
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
  const tSite = await getTranslations('site.pages');
  const formattedDate = formatLongDate(now.lastUpdated, locale);

  const sections = [
    { key: 'workingOn' as const, title: t('workingOn'), body: pickLocale(now.workingOn, locale) },
    { key: 'reading' as const, title: t('reading'), body: pickLocale(now.reading, locale) },
    { key: 'side' as const, title: t('side'), body: pickLocale(now.side, locale) },
  ];

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbList([
          { name: 'Home', path: '' },
          { name: t('title'), path: '/now' },
        ])}
      />
      <Section ariaLabelledBy="now-heading" surface="ink" className="pb-16 md:pt-24 md:pb-20">
        <SectionHead as="h1" id="now-heading" title={t('title')} comment={tSite('nowCommand')} />
        <p className="mt-8 font-mono text-sm text-ink-muted">
          <time dateTime={now.lastUpdated}>
            {t('lastUpdated')}: {formattedDate}
          </time>
        </p>
      </Section>
      <div className="surface-paper">
        <div
          className={`${sectionContainer} grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-x-12 gap-y-12 py-16 md:py-24`}
        >
          {sections.map((s) => (
            <section
              key={s.key}
              aria-labelledby={`now-${s.key}`}
              className="flex flex-col gap-3 border-t-2 border-foreground pt-6"
            >
              <h2
                id={`now-${s.key}`}
                className="font-display text-[28px] leading-[1.1] font-bold tracking-[-0.03em]"
              >
                {s.title}
              </h2>
              <p className="text-[17px] leading-[1.55] text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
