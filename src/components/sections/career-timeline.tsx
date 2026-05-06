'use client';
// src/components/sections/career-timeline.tsx — client (motion + IntersectionObserver)
// CAREER-01 (5 reverse-chronological roles), CAREER-02 (company/role/dates/2-4 bullets PT+EN),
// CAREER-03 (UAUBox 2019 IT-to-Engineering pivot marker — saber-color dot + Tooltip).
//
// Visual: vertical timeline with a left rail (border-l). Each role is an <li> with a
// dot on the rail; pivot:true gets a primary-colored (saber blue/red) dot wrapped in
// a Tooltip with "Pivot: IT → Engineering".
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  childVariant,
} from '@/components/ui';
import { career } from '@/data/career';
import type { Locale } from '@/i18n/routing';
import { formatPeriod, pickLocale } from '@/lib/i18n/helpers';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';

export function CareerTimeline() {
  const locale = useLocale() as Locale;
  const t = useTranslations('career');

  return (
    <section id="career" aria-labelledby="career-heading" className="mx-auto max-w-3xl px-4 py-12">
      <h2 id="career-heading" className="text-2xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <TooltipProvider delayDuration={150}>
        <motion.ol
          aria-label={t('sectionLabel')}
          className="relative mt-6 ml-2 border-l border-border"
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
              <motion.li
                key={role.id}
                className="relative mb-10 pl-6 last:mb-0"
                variants={childVariant}
              >
                {role.pivot ? (
                  <span
                    role="img"
                    aria-label={t('pivotLabel')}
                    className="absolute -left-[7px] top-1.5 inline-flex"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block size-3 rounded-full bg-primary ring-2 ring-background" />
                      </TooltipTrigger>
                      <TooltipContent side="right">{t('pivotTooltip')}</TooltipContent>
                    </Tooltip>
                  </span>
                ) : (
                  <span aria-hidden="true" className="absolute -left-[7px] top-1.5 inline-flex">
                    <span className="block size-3 rounded-full bg-muted-foreground/60 ring-2 ring-background" />
                  </span>
                )}

                <h3 className="text-lg font-semibold tracking-tight">{role.company}</h3>
                <p className="text-sm text-muted-foreground">
                  {roleLabel}
                  <span aria-hidden="true"> · </span>
                  <time>{period}</time>
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/60">
                  {bullets.map((b) => (
                    <li key={b.slice(0, 32)}>{b}</li>
                  ))}
                </ul>
              </motion.li>
            );
          })}
        </motion.ol>
      </TooltipProvider>
    </section>
  );
}
