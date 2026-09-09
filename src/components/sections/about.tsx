'use client';
import { Section, SectionHeader } from '@/components/ui';
import { about } from '@/data/about';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { useLocale, useTranslations } from 'next-intl';

export function About() {
  const locale = useLocale() as Locale;
  const tSec = useTranslations('sections');
  const paragraphs = pickLocale(about.paragraphs, locale);
  const cadence = pickLocale(about.cadence, locale);

  return (
    <Section id="about" aria-labelledby="about-heading" width="standard">
      <SectionHeader id="about-heading">{tSec('about')}</SectionHeader>

      <div className="flex flex-col gap-5">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 50)} className="text-base leading-relaxed text-foreground">
            {paragraph}
          </p>
        ))}

        <p className="text-sm text-muted-foreground pt-2">{cadence}</p>
      </div>
    </Section>
  );
}
