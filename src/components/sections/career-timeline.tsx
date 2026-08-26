'use client';
import { MonoBadge, RevealGroup, RevealItem, Section, SectionHeader } from '@/components/ui';
import { career } from '@/data/career';
import type { Locale } from '@/i18n/routing';
import { formatPeriod, pickLocale } from '@/lib/i18n/helpers';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';

export function CareerTimeline() {
  const locale = useLocale() as Locale;
  const t = useTranslations('career');

  return (
    <Section id="career" aria-labelledby="career-heading" width="standard">
      <SectionHeader id="career-heading">{t('title')}</SectionHeader>

      <RevealGroup className="space-y-0" stagger={0.06}>
        {/* Desktop: Horizontal scroll-snap */}
        <div className="hidden lg:flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
          {career.map((role) => {
            const period = formatPeriod(role.period, locale);
            const bullets = pickLocale(role.bullets, locale);
            const roleLabel = pickLocale(role.role, locale);

            return (
              <RevealItem key={role.id}>
                <article className="snap-start min-w-[320px] max-w-[380px] flex-shrink-0 flex flex-col">
                  <header className="mb-4">
                    <h3 className="text-lg font-semibold tracking-tight">{role.company}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {roleLabel} · <time>{period}</time>
                    </p>
                    {role.pivot && (
                      <MonoBadge variant="primary" className="mt-2 inline-flex">
                        {t('pivotLabel')}
                      </MonoBadge>
                    )}
                  </header>
                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {bullets.map((b) => (
                      <li
                        key={b.slice(0, 32)}
                        className="marker:text-muted-foreground/60 list-disc pl-4"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </article>
              </RevealItem>
            );
          })}
        </div>

        {/* Mobile: Vertical timeline with left rail */}
        <div className="lg:hidden">
          <motion.ol
            aria-label={t('sectionLabel')}
            className="relative border-l border-border ml-2"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {career.map((role) => {
              const period = formatPeriod(role.period, locale);
              const bullets = pickLocale(role.bullets, locale);
              const roleLabel = pickLocale(role.role, locale);

              return (
                <RevealItem key={role.id}>
                  <motion.li
                    className="relative mb-10 pl-6 last:mb-0"
                    variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                  >
                    {role.pivot ? (
                      <span
                        role="img"
                        aria-label={t('pivotLabel')}
                        className="absolute -left-[7px] top-1.5 inline-flex"
                      >
                        <span className="block size-3 rounded-full bg-primary ring-2 ring-background" />
                      </span>
                    ) : (
                      <span aria-hidden="true" className="absolute -left-[7px] top-1.5 inline-flex">
                        <span className="block size-3 rounded-full bg-muted-foreground/60 ring-2 ring-background" />
                      </span>
                    )}

                    <h3 className="text-lg font-semibold tracking-tight">{role.company}</h3>
                    <p className="text-sm text-muted-foreground">
                      {roleLabel} · <time>{period}</time>
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/60">
                      {bullets.map((b) => (
                        <li key={b.slice(0, 32)}>{b}</li>
                      ))}
                    </ul>
                  </motion.li>
                </RevealItem>
              );
            })}
          </motion.ol>
        </div>
      </RevealGroup>
    </Section>
  );
}
