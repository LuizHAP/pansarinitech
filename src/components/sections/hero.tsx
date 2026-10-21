import { HeroFieldGate, PaletteHint, TypedLine } from '@/components/site';
import { contact } from '@/data/contact';
import { hero } from '@/data/hero';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { getLocale, getTranslations } from 'next-intl/server';

export async function Hero() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale });
  const resumeHref = pickLocale(contact.resumePdf, locale);
  const resumeFile = resumeHref.split('/').pop() ?? 'resume.pdf';

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="surface-ink relative flex flex-col min-h-[max(640px,calc(100vh-64px))] scroll-mt-16 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(var(--color-ink-rule)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink-rule)_1px,transparent_1px)] bg-[size:48px_48px] bg-[position:-1px_-1px]"
      />
      <HeroFieldGate />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#0e0f0c_0%,rgb(14_15_12/0.85)_35%,rgb(14_15_12/0)_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,#0e0f0c,rgb(14_15_12/0))]"
      />

      <div className="relative mx-auto flex w-full max-w-[calc(1280px+4rem)] flex-1 flex-col justify-center gap-7 px-4 pt-12 pb-14 sm:gap-9 sm:px-5 sm:pt-24 sm:pb-16 md:px-8">
        <p className="font-mono text-sm tracking-[0.06em] text-ink-muted">
          {t('site.hero.eyebrow')}
        </p>
        <h1
          id="hero-heading"
          className="max-w-[900px] font-display text-[clamp(56px,9vw,136px)] leading-[0.88] font-extrabold tracking-[-0.05em]"
        >
          {hero.name}
        </h1>
        <TypedLine
          prefix={t('site.hero.typedPrefix')}
          words={t.raw('site.hero.typedWords') as string[]}
          srText={t('site.hero.typedSr')}
        />
        <p className="max-w-[620px] text-[17px] leading-[1.5] text-ink-body sm:text-lg md:text-[19px]">
          {pickLocale(hero.valueProp, locale)}
        </p>
        <div className="flex flex-wrap gap-3.5">
          <a
            href="#contact"
            className="inline-flex items-center rounded-[10px] bg-signal px-[26px] py-[18px] font-mono text-base font-semibold text-paper transition-transform duration-150 hover:-translate-y-[3px]"
          >
            {t('hero.contactCta')}
          </a>
          <a
            href={resumeHref}
            download={resumeFile}
            className="inline-flex items-center rounded-[10px] border-[1.5px] border-paper px-[26px] py-[17px] font-mono text-base font-medium text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            {t('hero.resumeCta')}
          </a>
        </div>
      </div>

      <PaletteHint label={t('site.hero.hintLabel')} ariaLabel={t('site.hero.hintAria')} />
    </section>
  );
}
