import { now } from '@/data/now';
import type { Locale } from '@/i18n/routing';
import { formatLongDate, pickLocale } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
// src/components/sections/now-preview.tsx — RSC
// Short summary on the home page; full /now route is its own page.
// Top of section shows <time dateTime={now.lastUpdated}> with locale-formatted long date.
import { useLocale, useTranslations } from 'next-intl';

export function NowPreview() {
  const locale = useLocale() as Locale;
  const t = useTranslations('now');

  return (
    <section
      id="now"
      aria-labelledby="now-preview-heading"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <h2 id="now-preview-heading" className="text-2xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        <time dateTime={now.lastUpdated}>
          {t('lastUpdated')}: {formatLongDate(now.lastUpdated, locale)}
        </time>
      </p>
      <p className="mt-4 leading-relaxed">{pickLocale(now.workingOn, locale)}</p>
      <p className="mt-4">
        <Link
          href="/now"
          className="underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          {t('previewLink')} →
        </Link>
      </p>
    </section>
  );
}
