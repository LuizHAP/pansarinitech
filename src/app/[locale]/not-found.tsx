import { Link } from '@/lib/i18n/navigation';
// src/app/[locale]/not-found.tsx
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';

export default async function LocaleNotFound() {
  const locale = await getLocale();
  setRequestLocale(locale as 'en' | 'pt'); // D-24
  const t = await getTranslations('notFound');
  const tSite = await getTranslations('site.notFound');

  return (
    <section className="mx-auto box-content flex max-w-[1280px] flex-col items-start px-4 py-24 md:px-8 md:py-32">
      <p className="font-mono text-sm leading-relaxed text-ink-muted md:text-base">
        <span className="block text-paper">{tSite('command')}</span>
        <span className="block">
          <span className="text-signal-soft">cd:</span> {tSite('error')}
        </span>
      </p>
      <h1 className="mt-8 font-display text-[clamp(96px,22vw,220px)] leading-[0.88] font-extrabold tracking-[-0.05em] text-paper">
        {t('title')}
        <span aria-hidden="true" className="lp-cursor ml-2 h-[0.7em] w-[0.12em] bg-signal" />
      </h1>
      <Link
        href="/"
        className="mt-12 inline-flex rounded-[10px] bg-signal px-[26px] py-[18px] font-mono text-base font-semibold text-paper transition-[transform,background-color,color] hover:-translate-y-[3px] hover:bg-paper hover:text-ink"
      >
        {t('cta')}
      </Link>
    </section>
  );
}
