import { Terminal } from '@/components/ui/terminal';
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
      className="mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:py-32"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Principal Software Engineer
          </span>
          <h1
            id="hero-heading"
            className="text-4xl font-medium tracking-tight leading-[1.1] sm:text-5xl lg:text-6xl"
          >
            {hero.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-prose">
            {pickLocale(hero.role, locale)}
          </p>
          <p className="text-base leading-relaxed max-w-prose text-foreground">
            {pickLocale(hero.valueProp, locale)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
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

        <div className="hidden lg:block">
          <Terminal
            lines={[
              { prompt: '~/pansarinitech', command: 'git log --oneline -5', output: null },
              {
                prompt: null,
                command: null,
                output: 'a1b2c3d feat: redesign hero with split layout',
              },
              {
                prompt: null,
                command: null,
                output: 'e4f5g6h fix: tighten color tokens to zinc/slate',
              },
              {
                prompt: null,
                command: null,
                output: 'i7j8k9l refactor: skills as grouped mono badges',
              },
              { prompt: null, command: null, output: 'm0n1o2p chore: update globals.css palette' },
              { prompt: '~/pansarinitech', command: 'pnpm build && pnpm lint', output: null },
              { prompt: null, command: null, output: '✓ Build successful — 47 pages generated' },
              { prompt: null, command: null, output: '✓ Lint passed — 0 errors, 0 warnings' },
              { prompt: '~/pansarinitech', command: '_', output: null },
            ]}
            className="h-[420px] max-h-[60vh]"
          />
        </div>
      </div>
    </section>
  );
}
