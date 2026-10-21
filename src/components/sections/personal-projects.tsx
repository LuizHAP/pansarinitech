'use client';
import { SectionHead } from '@/components/site';
import { MonoBadge, Section } from '@/components/ui';
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
    <MonoBadge variant="primary" className="shrink-0 text-[10px] tracking-wider uppercase">
      {status === 'live' ? labels.live : labels.inDev}
    </MonoBadge>
  );
}

function ProjectScreenshot({ project }: { project: PersonalProject }) {
  if (project.screenshot) {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden bg-ink">
        <Image
          src={project.screenshot}
          alt={project.name}
          width={640}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br ${project.accentColor}`}
    >
      <span className="font-mono text-xs text-ink-body">{project.name}</span>
    </div>
  );
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '');
}

export function PersonalProjects() {
  const locale = useLocale() as Locale;
  const t = useTranslations('personalProjects');
  const tSite = useTranslations('site.sections');

  return (
    <Section
      id="personal-projects"
      ariaLabelledBy="personal-projects-heading"
      surface="ink"
      className="pt-0 md:pt-0"
    >
      <SectionHead
        id="personal-projects-heading"
        title={t('title')}
        comment={tSite('personalComment')}
      />
      <p className="mt-6 max-w-[620px] text-[17px] leading-[1.5] text-ink-body">{t('subtitle')}</p>

      <div className="mt-14 grid grid-cols-1 gap-7 lg:grid-cols-2">
        {personalProjects.map((project) => {
          const primaryUrl = project.liveUrl ?? project.githubUrl;
          return (
            <article
              key={project.id}
              className={cn(
                'flex flex-col overflow-hidden rounded-[14px] border-[1.5px] border-ink-line bg-ink-card',
                project.screenshotDraft && 'ring-1 ring-amber-500/30',
              )}
            >
              <div
                aria-hidden="true"
                className="flex items-center gap-[7px] border-b-[1.5px] border-ink-line px-3.5 py-[11px]"
              >
                <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
                <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
                <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
                {primaryUrl && (
                  <span className="ml-2 truncate font-mono text-[11px] text-ink-muted">
                    {displayUrl(primaryUrl)}
                  </span>
                )}
              </div>
              <ProjectScreenshot project={project} />

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
                    {project.name}
                  </h3>
                  <StatusBadge
                    status={project.status}
                    labels={{ live: t('statusLive'), inDev: t('statusInDev') }}
                  />
                </div>

                <p className="mt-3 line-clamp-3 text-base leading-[1.5] text-ink-body">
                  {project.description[locale]}
                </p>

                <p className="mt-4 font-mono text-[13px] text-ink-muted">
                  {project.stack.join(' · ')}
                </p>

                <div className="mt-auto flex items-center gap-5 pt-5">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('visitSite')} ${project.name} (${t('newTab')})`}
                      className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-signal-soft underline-offset-4 hover:underline"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      {t('visitSite')}
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('viewCode')} ${project.name} (${t('newTab')})`}
                      className="flex items-center gap-1.5 font-mono text-[13px] text-ink-body underline-offset-4 hover:text-paper hover:underline"
                    >
                      <Icon icon="mdi:github" className="size-3.5" aria-hidden="true" />
                      {t('viewCode')}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
