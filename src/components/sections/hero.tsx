import { Badge } from '@/components/ui';
import { career } from '@/data/career';
import { contact } from '@/data/contact';
import { hero } from '@/data/hero';
import type { Locale } from '@/i18n/routing';
import { formatPeriod, pickLocale } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
import { getProjects } from '@/lib/mdx/projects';
import type { Project } from '@/lib/mdx/schema';
import { cn } from '@/lib/utils';
import { getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';
import machineryEcommerce from '../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../content/projects/magazine-luiza-superapp/images/hero.jpg';

const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'machinery-mobile-first': machineryMobileFirst,
} as const;

function ProjectCard({
  project,
  featured,
  readMore,
}: {
  project: Project;
  featured: boolean;
  readMore: string;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        'group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        featured
          ? 'col-span-2 flex-col sm:flex-row'
          : 'col-span-2 flex-row sm:col-span-1 sm:flex-col',
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-muted',
          featured
            ? 'aspect-[16/9] w-full sm:aspect-auto sm:min-h-56 sm:w-1/2'
            : 'w-28 sm:aspect-[16/9] sm:w-full',
        )}
      >
        <Image
          src={HERO_IMAGES[project.slug as keyof typeof HERO_IMAGES]}
          alt=""
          fill
          priority={featured}
          placeholder="blur"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={featured ? '(max-width: 640px) 100vw, 30vw' : '(max-width: 640px) 112px, 30vw'}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <p className="font-mono text-xs text-muted-foreground">
          {featured ? `${project.year} · ${project.role}` : project.year}
        </p>
        <h2
          className={cn(
            'font-medium tracking-tight text-foreground',
            featured ? 'text-lg sm:text-xl' : 'text-base',
          )}
        >
          {project.title}
        </h2>
        <p
          className={cn(
            'text-sm leading-relaxed text-muted-foreground',
            featured ? 'line-clamp-3' : 'line-clamp-2',
          )}
        >
          {project.blurb}
        </p>
        <div className={cn('mt-auto flex-wrap gap-1.5 pt-1', featured ? 'flex' : 'hidden sm:flex')}>
          {project.stack.slice(0, featured ? 4 : 3).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs text-muted-foreground">
              {tech}
            </Badge>
          ))}
        </div>
        {featured && (
          <p className="pt-1 text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
            {readMore}
          </p>
        )}
      </div>
    </Link>
  );
}

export async function Hero() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'hero' });
  const tProj = await getTranslations({ locale, namespace: 'projects' });
  const resumeHref = pickLocale(contact.resumePdf, locale);
  const resumeFile = resumeHref.split('/').pop() ?? 'resume.pdf';

  const allProjects = await getProjects(locale);
  const featuredProjects = allProjects.filter((p) => p.featured).slice(0, 3);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <div className="lg:col-span-5 flex flex-col bg-card border border-border rounded-xl p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                <Image
                  src="/luiz.jpg"
                  alt={t('photoAlt')}
                  fill
                  priority
                  className="object-cover rounded-lg"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0">
                <h1
                  id="hero-heading"
                  className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight"
                >
                  {hero.name}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
                  {pickLocale(hero.role, locale)}
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-foreground">
              {pickLocale(hero.valueProp, locale)}
            </p>
          </div>

          <div className="hidden lg:block mt-8 border-t border-border pt-6">
            <p
              id="hero-experience"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              {t('experienceLabel')}
            </p>
            <ul aria-labelledby="hero-experience" className="mt-3 flex flex-col gap-2.5">
              {career.map((role) => (
                <li key={role.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-foreground">{role.company}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formatPeriod(role.period, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto lg:pt-8">
            <a
              href="#contact"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('contactCta')}
            </a>
            <a
              href={resumeHref}
              download={resumeFile}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('resumeCta')}
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 gap-4 lg:gap-5">
          {featuredProjects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              featured={index === 0}
              readMore={tProj('cta.readMore')}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Link
          href="/projects"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          {tProj('cta.viewAll')}
        </Link>
      </div>
    </section>
  );
}
