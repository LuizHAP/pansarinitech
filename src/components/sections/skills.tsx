import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { skills } from '@/data/skills';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
// src/components/sections/skills.tsx — RSC
// SKILLS-01 (7 categories: frontend, mobile, backend, testing, cloud, databases, tools),
// SKILLS-02 (daily-use highlight: font-semibold + 1px primary underline).
//
// Card grid: 1 col mobile / 2 cols sm / 3 cols lg. No skill bars / no percentages.
// Daily-use chips get `font-semibold underline decoration-primary decoration-1
// underline-offset-4` so the underline color flips Jedi blue ↔ Sith red on theme toggle.
import { useLocale, useTranslations } from 'next-intl';

export function Skills() {
  const locale = useLocale() as Locale;
  const t = useTranslations('skills');

  return (
    <section id="skills" aria-labelledby="skills-heading" className="mx-auto max-w-5xl px-4 py-12">
      <h2 id="skills-heading" className="text-2xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('dailyUseLegend')}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-base">{pickLocale(category.label, locale)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-x-3 gap-y-2 text-sm">
                {category.items.map((item) => (
                  <li
                    key={item.name}
                    className={
                      item.daily
                        ? 'font-semibold underline decoration-primary decoration-1 underline-offset-4'
                        : 'text-muted-foreground'
                    }
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
