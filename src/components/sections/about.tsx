import { Section } from '@/components/ui';
import { about } from '@/data/about';
import { aboutStats } from '@/data/about-stats';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

const frameRect = { x: 3, y: 3, width: 394, height: 594, rx: 14, fill: 'none', strokeWidth: 6 };

function PhotoFrame() {
  return (
    <svg
      viewBox="0 0 400 600"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <rect {...frameRect} stroke="#eeece6" />
      <rect
        {...frameRect}
        stroke="#0e0f0c"
        pathLength={100}
        strokeDasharray="14 86"
        strokeLinecap="round"
        data-anim=""
        className="animate-[lp-frame_5s_linear_infinite]"
      />
      <rect
        {...frameRect}
        stroke="#0e0f0c"
        pathLength={100}
        strokeDasharray="6 94"
        strokeDashoffset={-50}
        strokeLinecap="round"
        data-anim=""
        className="animate-[lp-frame2_5s_linear_infinite]"
      />
    </svg>
  );
}

export function About() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const paragraphs = pickLocale(about.paragraphs, locale);

  return (
    <Section
      id="about"
      ariaLabelledBy="about-heading"
      surface="paper"
      className="grid items-center gap-16 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"
    >
      <div className="relative mx-auto aspect-[2/3] w-[calc(100%-16px)] max-w-[420px] md:mx-0">
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl bg-signal"
        />
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-ink">
          <Image
            src="/luiz.jpg"
            alt={t('hero.photoAlt')}
            fill
            sizes="(max-width: 768px) 90vw, 420px"
            className="object-cover object-[50%_30%]"
          />
        </div>
        <PhotoFrame />
        <p
          aria-hidden="true"
          className="absolute bottom-5 left-5 rounded-lg bg-ink px-3.5 py-2.5 font-mono text-[13px] text-paper"
        >
          <span className="text-signal-soft">&gt;</span>
          {t('site.sections.aboutComment').replace(/^>/, '')}
        </p>
      </div>

      <div className="flex flex-col gap-7">
        <h2
          id="about-heading"
          className="font-display text-[clamp(44px,6vw,84px)] leading-[0.92] font-extrabold tracking-[-0.045em]"
        >
          {t('sections.about')}
        </h2>
        <div className="flex max-w-[560px] flex-col gap-[18px] text-[19px] leading-[1.55]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 50)}>{paragraph}</p>
          ))}
        </div>
        <p className="text-base text-muted-foreground">{pickLocale(about.cadence, locale)}</p>
        <dl
          aria-label={t('site.about.statsLabel')}
          className="flex flex-wrap gap-x-7 gap-y-3 border-t border-paper-muted/40 pt-5 font-mono text-sm"
        >
          {aboutStats.map((stat) => (
            <div key={stat.num} className="flex flex-row-reverse items-baseline justify-end gap-2">
              <dt className="text-muted-foreground">{pickLocale(stat.label, locale)}</dt>
              <dd className={cn('font-semibold', stat.accent ? 'text-signal' : 'text-foreground')}>
                {stat.num}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
