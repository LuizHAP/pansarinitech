'use client';
import {
  MonoBadge,
  RevealGroup,
  RevealItem,
  Section,
  SectionHeader,
  SkillBadge,
} from '@/components/ui';
import type { PersonalProject } from '@/data/personal-projects';
import { personalProjects } from '@/data/personal-projects';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

function StatusBadge({
  status,
  labels,
}: { status: PersonalProject['status']; labels: { live: string; inDev: string } }) {
  return (
    <MonoBadge variant="primary" className="text-[10px] uppercase tracking-wider">
      {status === 'live' ? labels.live : labels.inDev}
    </MonoBadge>
  );
}

function ProjectScreenshot({
  project,
  priority,
}: {
  project: PersonalProject;
  priority?: boolean;
}) {
  if (project.screenshot) {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image
          src={project.screenshot}
          alt={project.name}
          width={640}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          priority={priority}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`aspect-[16/10] w-full bg-gradient-to-br ${project.accentColor} flex items-center justify-center`}
    >
      <span className="font-mono text-xs text-muted-foreground">{project.name}</span>
    </div>
  );
}

export function PersonalProjects() {
  const locale = useLocale() as Locale;
  const t = useTranslations('personalProjects');

  return (
    <Section id="personal-projects" aria-labelledby="personal-projects-heading" width="wide">
      <SectionHeader id="personal-projects-heading">{t('title')}</SectionHeader>
      <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>

      <RevealGroup className="grid gap-4 grid-cols-1 lg:grid-cols-2" stagger={0.06}>
        {personalProjects.map((project, index) => (
          <RevealItem key={project.id}>
            <article
              className={cn(
                'group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50',
                project.screenshotDraft && 'ring-1 ring-amber-500/30',
              )}
            >
              <ProjectScreenshot project={project} priority={index === 0} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-medium leading-snug">{project.name}</h3>
                  <StatusBadge
                    status={project.status}
                    labels={{ live: t('statusLive'), inDev: t('statusInDev') }}
                  />
                </div>

                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {project.description[locale]}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <SkillBadge key={tech} name={tech} />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('visitSite')} ${project.name} (${t('newTab')})`}
                      className="flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      {t('visitSite')}
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('viewCode')} ${project.name} (${t('newTab')})`}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <Icon icon="mdi:github" className="h-3 w-3" aria-hidden="true" />
                      {t('viewCode')}
                    </a>
                  )}
                </div>
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
