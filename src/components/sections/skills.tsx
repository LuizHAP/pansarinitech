'use client';
import { RevealGroup, RevealItem, Section, SectionHeader, SkillBadge } from '@/components/ui';
import skillIconsData from '@/data/skill-icons.json';
import { skills } from '@/data/skills';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Icon, addCollection } from '@iconify/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

export function Skills() {
  const locale = useLocale() as Locale;
  const t = useTranslations('skills');

  useEffect(() => {
    addCollection(skillIconsData as Parameters<typeof addCollection>[0]);
  }, []);

  return (
    <Section id="skills" aria-labelledby="skills-heading" width="standard">
      <SectionHeader id="skills-heading">{t('title')}</SectionHeader>
      <p className="text-sm text-muted-foreground mb-8">{t('dailyUseLegend')}</p>

      <RevealGroup className="space-y-10" stagger={0.04}>
        {skills.map((category) => (
          <RevealItem key={category.id}>
            <div className="flex flex-col gap-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {category.label[locale]}
              </dt>
              <dd className="flex flex-wrap gap-2">
                {category.items.map((skill) => (
                  <span
                    key={`${category.id}:${skill.name}`}
                    className={cn(
                      'font-mono text-xs px-2 py-1 rounded transition-colors',
                      skill.daily
                        ? 'text-foreground underline decoration-primary decoration-1 underline-offset-2'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {skill.icon && !skill.textBadge ? (
                      <Icon
                        icon={skill.icon}
                        width={14}
                        height={14}
                        aria-hidden="true"
                        className="inline-block align-middle mr-1"
                      />
                    ) : null}
                    {skill.mono ?? skill.name}
                  </span>
                ))}
              </dd>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
