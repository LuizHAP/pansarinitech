import { SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { now } from '@/data/now';
import type { Locale } from '@/i18n/routing';
import { formatLongDate, pickLocale } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';

const ITEMS = ['workingOn', 'reading', 'side'] as const;

export function NowPreview() {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Section id="now" ariaLabelledBy="now-preview-heading" surface="paper">
      <SectionHead
        id="now-preview-heading"
        title={t('now.title')}
        comment={t('site.sections.nowComment')}
      />
      <p className="mt-6 font-mono text-sm text-muted-foreground">
        <time dateTime={now.lastUpdated}>
          {t('now.lastUpdated')}: {formatLongDate(now.lastUpdated, locale)}
        </time>
      </p>

      <div className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-x-12 gap-y-10">
        {ITEMS.map((key) => (
          <div key={key} className="flex flex-col gap-3 border-t-2 border-ink pt-6">
            <h3 className="text-2xl leading-[1.15] font-bold tracking-[-0.02em]">
              {t(`now.${key}`)}
            </h3>
            <p className="text-[17px] leading-[1.5] text-muted-foreground">
              {pickLocale(now[key], locale)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10">
        <Link
          href="/now"
          className="font-mono text-sm font-semibold underline decoration-signal decoration-2 underline-offset-4 hover:text-signal"
        >
          {t('now.previewLink')} →
        </Link>
      </p>
    </Section>
  );
}
