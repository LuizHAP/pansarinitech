'use client';
import { RevealGroup, RevealItem } from '@/components/ui';
import { KeyValueGroup, MonoBadge, Section, SectionHeader } from '@/components/ui';
import { about } from '@/data/about';
import { aboutBullets, aboutStats } from '@/data/about-stats';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { useLocale, useTranslations } from 'next-intl';

export function About() {
  const locale = useLocale() as Locale;
  const tSec = useTranslations('sections');
  const cadence = pickLocale(about.cadence, locale);

  const statItems = aboutStats.map((stat) => ({
    label: stat.label[locale],
    value: stat.num,
  }));

  return (
    <Section id="about" aria-labelledby="about-heading" width="standard">
      <SectionHeader id="about-heading">{tSec('about')}</SectionHeader>

      <RevealGroup className="flex flex-col gap-8" stagger={0.04}>
        <RevealItem>
          <KeyValueGroup items={statItems} columns={4} />
        </RevealItem>

        <RevealItem>
          <hr className="border-border" />
        </RevealItem>

        <RevealItem>
          <ul className="flex flex-col gap-4">
            {aboutBullets.map((bullet) => (
              <li
                key={bullet.text[locale]}
                className="flex items-start gap-3 text-sm leading-relaxed"
              >
                <MonoBadge variant="outline" className="shrink-0 mt-0.5" aria-hidden="true">
                  {bullet.icon}
                </MonoBadge>
                <span className="text-foreground">{bullet.text[locale]}</span>
              </li>
            ))}
          </ul>
        </RevealItem>

        <RevealItem>
          <hr className="border-border" />
        </RevealItem>

        <RevealItem>
          <p className="text-sm italic text-muted-foreground">{cadence}</p>
        </RevealItem>
      </RevealGroup>
    </Section>
  );
}
