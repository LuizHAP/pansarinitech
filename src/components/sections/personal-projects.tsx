'use client';

// src/components/sections/personal-projects.tsx
// Grid of personal side-project cards with screenshot previews, tech stack badges,
// and links to live deployments and GitHub repos.
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RevealGroup,
  RevealItem,
} from '@/components/ui';
import type { PersonalProject } from '@/data/personal-projects';
import { personalProjects } from '@/data/personal-projects';
import type { Locale } from '@/i18n/routing';
import { Icon } from '@iconify/react';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

function StatusBadge({
  status,
  labels,
}: { status: PersonalProject['status']; labels: { live: string; inDev: string } }) {
  return (
    <Badge
      variant={status === 'live' ? 'default' : 'secondary'}
      className="text-[10px] font-medium uppercase tracking-wide"
    >
      {status === 'live' ? labels.live : labels.inDev}
    </Badge>
  );
}

function ProjectScreenshot({ project }: { project: PersonalProject }) {
  if (project.screenshot) {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image
          src={project.screenshot}
          alt={project.name}
          width={640}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
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
    <section
      id="personal-projects"
      aria-labelledby="personal-projects-heading"
      className="mx-auto max-w-5xl px-4 py-12"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 id="personal-projects-heading" className="text-2xl font-semibold tracking-tight">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
        {personalProjects.map((project) => (
          <RevealItem key={project.id}>
            <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
              <ProjectScreenshot project={project} />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{project.name}</CardTitle>
                  <StatusBadge
                    status={project.status}
                    labels={{ live: t('statusLive'), inDev: t('statusInDev') }}
                  />
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {project.description[locale]}
                </p>

                <div className="flex flex-wrap gap-1">
                  {project.stack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-[10px]">
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('visitSite')} ${project.name} (${t('newTab')})`}
                      className="flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
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
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      <Icon icon="mdi:github" className="h-3 w-3" aria-hidden="true" />
                      {t('viewCode')}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
