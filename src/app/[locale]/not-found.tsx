import { Button } from '@/components/ui/button';
import { aurebesh } from '@/lib/fonts';
import { Link } from '@/lib/i18n/navigation';
// src/app/[locale]/not-found.tsx
// Localized 404 — UX-04 + EASTER-01 + UI-SPEC §"404 Page Layout Specification".
// Heading hierarchy: one heading only — Pitfall 13 (no h2 needed for this layout).
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';

export default async function LocaleNotFound() {
  const locale = await getLocale();
  setRequestLocale(locale as 'en' | 'pt'); // D-24
  const t = await getTranslations('notFound');

  return (
    <section className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      {/* Layer 1: Numeric 404 — display heading, h1 (UI-SPEC §"Typography") */}
      <h1 className="text-[clamp(72px,20vw,96px)] font-bold leading-none">{t('title')}</h1>

      {/* Layer 2: Aurebesh decorative accent — aria-hidden + sr-only fallback (A11Y-07).
          Inline style references var(--font-aurebesh); when the real OFL binary lands,
          `aurebesh.className` will populate the var via next/font/local. */}
      <span
        aria-hidden="true"
        className={`pb-2 pt-2 text-2xl text-muted-foreground ${aurebesh.className}`}
        style={{ fontFamily: 'var(--font-aurebesh)' }}
      >
        {t('title')}
      </span>
      <span className="sr-only">{t('aurebeshFallback')}</span>

      {/* Layer 3: SW reference body line — paragraph, not heading (Pitfall 13) */}
      <p className="mt-4 text-base">{t('swReference')}</p>

      {/* Layer 4: CTA Button — Shadcn default variant, primary fill */}
      <Button asChild className="mt-8">
        <Link href="/">{t('cta')}</Link>
      </Button>
    </section>
  );
}
