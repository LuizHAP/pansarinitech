import { contact } from '@/data/contact';
import { hero } from '@/data/hero';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
// src/components/sections/hero.tsx — RSC
// HERO-01 (D-07: country-only deviation), HERO-02 (Contact + Resume CTAs).
//
// Hero photo: next/image with `preload` (Next 16 — supersedes the legacy LCP-hint prop)
// + automatic blurDataURL from the static import. Square 256×256 desktop / 160×160
// mobile via object-cover crop on the underlying 768×1024 portrait JPEG.
//
// Two CTAs only (D-08):
//   1. Contact — anchor to home page #contact section
//   2. Resume — locale-correct PDF download (en → Resume; pt → Currículo) via
//      pickLocale(contact.resumePdf, locale). The download attribute forces the
//      filename on save so the recruiter sees a recognizable file.
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import luizPhoto from '../../../public/luiz.jpg';

export function Hero() {
  const locale = useLocale() as Locale;
  const t = useTranslations('hero');
  const resumeHref = pickLocale(contact.resumePdf, locale);
  const resumeFile = resumeHref.split('/').pop() ?? 'resume.pdf';

  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 sm:flex-row-reverse sm:items-center sm:justify-between sm:py-20"
    >
      <Image
        src={luizPhoto}
        alt={pickLocale(hero.photoAlt, locale)}
        width={256}
        height={256}
        sizes="(max-width: 768px) 160px, 256px"
        priority
        placeholder="blur"
        className="size-40 rounded-full object-cover sm:size-64"
      />
      <div className="flex flex-col gap-3 text-center sm:text-left">
        <h1 id="hero-heading" className="text-4xl font-bold tracking-tight sm:text-5xl">
          {hero.name}
        </h1>
        <p className="text-lg text-muted-foreground">{pickLocale(hero.role, locale)}</p>
        <p className="max-w-prose text-base leading-relaxed">
          {pickLocale(hero.valueProp, locale)}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3 sm:justify-start">
          <a
            href="#contact"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
