import { SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { skills } from '@/data/skills';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

export function Skills() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const lastIndex = skills.length - 1;

  return (
    <Section id="skills" ariaLabelledBy="skills-heading" surface="paper">
      <SectionHead
        id="skills-heading"
        title={t('skills.title')}
        comment={t('site.sections.skillsComment')}
      />
      <p className="mt-6 font-mono text-sm text-muted-foreground">{t('skills.dailyUseLegend')}</p>

      <div className="mt-14 grid grid-cols-1 gap-0.5 border-2 border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
        {skills.map((category, index) => (
          <div
            key={category.id}
            className={cn(
              'flex flex-col gap-6 bg-paper p-8 transition-colors duration-200 hover:bg-paper-card lg:min-h-[300px]',
              index === lastIndex && skills.length % 2 === 1 && 'sm:col-span-2',
              index === lastIndex && skills.length % 4 === 3 && 'lg:col-span-2',
            )}
          >
            <span aria-hidden="true" className="font-mono text-[13px] text-signal">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-[34px] leading-none font-extrabold tracking-[-0.035em]">
              {category.label[locale]}
            </h3>
            <ul className="mt-auto flex flex-wrap gap-x-1.5 gap-y-1 font-mono text-[13px] leading-relaxed">
              {category.items.map((skill, i) => (
                <li key={`${category.id}:${skill.name}`} className="flex gap-1.5">
                  <span
                    className={cn(
                      skill.daily
                        ? 'text-foreground underline decoration-signal decoration-2 underline-offset-4'
                        : 'text-muted-foreground',
                    )}
                  >
                    {skill.name}
                  </span>
                  {i < category.items.length - 1 && (
                    <span aria-hidden="true" className="text-muted-foreground">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
