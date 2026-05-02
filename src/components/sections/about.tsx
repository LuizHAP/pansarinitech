import { about } from '@/data/about';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
// src/components/sections/about.tsx — RSC
// HERO-03: 4-paragraph bio + cadence statement, expanding the Hero's tight value prop
// into the longer career-arc story. Anchor id="about" so a future header nav can scroll.
import { useLocale, useTranslations } from 'next-intl';

export function About() {
  const locale = useLocale() as Locale;
  const tSec = useTranslations('sections');
  const paragraphs = pickLocale(about.paragraphs, locale);

  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto max-w-3xl px-4 py-12">
      <h2 id="about-heading" className="text-2xl font-semibold tracking-tight">
        {tSec('about')}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
        <p className="text-sm italic">{pickLocale(about.cadence, locale)}</p>
      </div>
    </section>
  );
}
