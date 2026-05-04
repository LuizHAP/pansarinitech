'use client';
import { RevealGroup, RevealItem } from '@/components/ui';
import { about } from '@/data/about';
// src/components/sections/about.tsx — v1.1 redesign (Client for motion)
// Layout: stats row (4 cards) → hr → bullet highlights → hr → cadence line.
// Replaces the 4-paragraph prose block from v1.0.
import { aboutBullets, aboutStats } from '@/data/about-stats';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { Code2, Globe, Smartphone, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const ICONS = { TrendingUp, Code2, Smartphone, Globe } as const;

export function About() {
  const locale = useLocale() as Locale;
  const tSec = useTranslations('sections');
  const cadence = pickLocale(about.cadence, locale);

  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto max-w-3xl px-4 py-12">
      <h2 id="about-heading" className="text-2xl font-semibold tracking-tight">
        {tSec('about')}
      </h2>

      {/* Stats row */}
      <RevealGroup className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" stagger={0.06}>
        {aboutStats.map((stat) => (
          <RevealItem key={stat.num}>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-4 py-5 text-center">
              <span
                className={[
                  'font-bold tracking-tight leading-none',
                  stat.small ? 'text-2xl' : 'text-3xl',
                  'text-foreground',
                ].join(' ')}
              >
                {stat.num}
              </span>
              <span className="text-[11px] lowercase tracking-wide text-muted-foreground">
                {stat.label[locale]}
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <hr className="my-6 border-border" />

      {/* Bullet highlights */}
      <RevealGroup className="flex flex-col gap-3" stagger={0.06}>
        {aboutBullets.map((bullet) => {
          const Icon = ICONS[bullet.icon];
          return (
            <RevealItem key={bullet.icon}>
              <div className="flex items-start gap-3 text-sm leading-relaxed">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{bullet.text[locale]}</span>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <hr className="my-6 border-border" />

      <p className="text-sm italic text-muted-foreground">{cadence}</p>
    </section>
  );
}
