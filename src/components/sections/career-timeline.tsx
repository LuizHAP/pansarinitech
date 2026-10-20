import { SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { career } from '@/data/career';
import type { Locale } from '@/i18n/routing';
import { formatPeriod, pickLocale } from '@/lib/i18n/helpers';
import { useLocale, useTranslations } from 'next-intl';

export function CareerTimeline() {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Section id="career" ariaLabelledBy="career-heading" surface="ink">
      <SectionHead
        id="career-heading"
        title={t('career.title')}
        comment={t('site.sections.careerComment')}
      />

      <ol aria-label={t('career.sectionLabel')} className="mt-14 flex flex-col gap-12">
        {career.map((role, index) => (
          <li
            key={role.id}
            className="grid gap-4 border-t-2 border-foreground pt-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10"
          >
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[13px] text-ink-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-mono text-[22px] leading-tight font-semibold tracking-[-0.02em] sm:text-[26px]">
                <span aria-hidden="true" className="text-signal-soft">
                  ${' '}
                </span>
                {role.company}
              </h3>
              {role.pivot && (
                <span className="w-fit rounded bg-signal px-2 py-1 font-mono text-[11px] tracking-wider text-paper uppercase">
                  {t('career.pivotTooltip')}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-mono text-sm text-ink-muted">
                {pickLocale(role.role, locale)} · <time>{formatPeriod(role.period, locale)}</time>
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-[17px] leading-[1.5] text-ink-body marker:text-ink-muted">
                {pickLocale(role.bullets, locale).map((bullet) => (
                  <li key={bullet.slice(0, 32)}>{bullet}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
