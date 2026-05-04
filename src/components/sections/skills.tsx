'use client';
// src/components/sections/skills.tsx — v1.1 redesign (Client for useState filter)
// Filter chips + logo/icon badge grid. Uses @iconify/react for brand logos;
// textBadge:true items get a mono-font pill fallback.
import { RevealGroup, RevealItem } from '@/components/ui';
import { skills } from '@/data/skills';
import type { Locale } from '@/i18n/routing';
import { Icon } from '@iconify/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

const FILTERS = [
  { id: 'all', label: { en: 'All', pt: 'Todos' } },
  { id: 'frontend', label: { en: 'Frontend', pt: 'Frontend' } },
  { id: 'mobile', label: { en: 'Mobile', pt: 'Mobile' } },
  { id: 'backend', label: { en: 'Backend', pt: 'Backend' } },
  { id: 'testing', label: { en: 'Testing', pt: 'Testes' } },
  { id: 'cloud', label: { en: 'Cloud', pt: 'Cloud' } },
  { id: 'databases', label: { en: 'Databases', pt: 'Bancos' } },
  { id: 'tools', label: { en: 'Tools', pt: 'Ferramentas' } },
] as const;

export function Skills() {
  const locale = useLocale() as Locale;
  const t = useTranslations('skills');
  const [active, setActive] = useState<string>('all');

  const flatItems = skills.flatMap((cat) => cat.items.map((item) => ({ ...item, catId: cat.id })));
  const filtered = active === 'all' ? flatItems : flatItems.filter((s) => s.catId === active);

  return (
    <section id="skills" aria-labelledby="skills-heading" className="mx-auto max-w-5xl px-4 py-12">
      <h2 id="skills-heading" className="text-2xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('dailyUseLegend')}</p>

      {/* Filter chips — horizontal scroll on mobile */}
      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
        role="group"
        aria-label="Filter skills by category"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg,#000 92%,transparent 100%)',
          maskImage: 'linear-gradient(90deg,#000 92%,transparent 100%)',
        }}
      >
        {FILTERS.map((f) => {
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              aria-pressed={isActive}
              className={[
                'flex-none rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary',
              ].join(' ')}
            >
              {f.label[locale]}
            </button>
          );
        })}
      </div>

      {/* Badge grid */}
      <RevealGroup
        key={active}
        className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        stagger={0.04}
      >
        {filtered.map((skill) => (
          <RevealItem key={`${skill.catId}:${skill.name}`}>
            <div className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-4 transition-all hover:border-primary/50 hover:shadow-sm">
              {/* Logo or text badge */}
              <div
                className={[
                  'flex size-8 items-center justify-center rounded',
                  skill.textBadge || !skill.icon
                    ? 'bg-muted font-mono text-[10px] text-muted-foreground'
                    : 'bg-white',
                ].join(' ')}
                aria-hidden="true"
              >
                {skill.icon && !skill.textBadge ? (
                  <Icon icon={skill.icon} width={24} height={24} />
                ) : (
                  <span>{skill.mono ?? skill.name.slice(0, 3)}</span>
                )}
              </div>
              {/* Name */}
              <span
                className={[
                  'text-center text-[11px] font-medium leading-tight',
                  skill.daily
                    ? 'text-primary underline decoration-primary decoration-1 underline-offset-4'
                    : 'text-foreground',
                ].join(' ')}
              >
                {skill.name}
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
