import { contact } from '@/data/contact';
import { hero } from '@/data/hero';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

export function Hero() {
  const locale = useLocale() as Locale;
  const t = useTranslations('hero');
  const resumeHref = pickLocale(contact.resumePdf, locale);
  const resumeFile = resumeHref.split('/').pop() ?? 'resume.pdf';

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <h1
              id="hero-heading"
              className="text-3xl font-semibold tracking-tight leading-[1.15] sm:text-4xl lg:text-5xl"
            >
              {hero.name}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium">
              {pickLocale(hero.role, locale)}
            </p>
          </div>

          <p className="text-base leading-relaxed text-foreground">
            {pickLocale(hero.valueProp, locale)}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#contact"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('contactCta')}
            </a>
            <a
              href={resumeHref}
              download={resumeFile}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('resumeCta')}
            </a>
          </div>
        </div>

        <div className="relative order-first lg:order-last flex justify-center lg:justify-end">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80">
            <Image
              src="/luiz.jpg"
              alt={t('photoAlt')}
              fill
              priority
              className="object-cover rounded-2xl shadow-lg"
              sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 320px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
