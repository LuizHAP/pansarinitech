import { contact } from '@/data/contact';
import { hero } from '@/data/hero';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { useLocale, useTranslations } from 'next-intl';

export function Hero() {
  const locale = useLocale() as Locale;
  const t = useTranslations('hero');
  const resumeHref = pickLocale(contact.resumePdf, locale);
  const resumeFile = resumeHref.split('/').pop() ?? 'resume.pdf';

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="mx-auto max-w-3xl px-4 py-20 sm:py-28 lg:py-36"
    >
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <h1
            id="hero-heading"
            className="text-4xl font-semibold tracking-tight leading-[1.15] sm:text-5xl lg:text-6xl"
          >
            {hero.name}
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground font-medium">
            {pickLocale(hero.role, locale)}
          </p>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-foreground max-w-2xl">
          {pickLocale(hero.valueProp, locale)}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="#contact"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('contactCta')}
          </a>
          <a
            href={resumeHref}
            download={resumeFile}
            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('resumeCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
