import { contact } from '@/data/contact';
import { hero } from '@/data/hero';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
import { getProjects } from '@/lib/mdx/projects';
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
      {/* Bento Grid: Identity + Work */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Identity Card - spans 5 cols on desktop */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-card border border-border rounded-xl p-6 sm:p-8">
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

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
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

        {/* Featured Projects Grid - spans 7 cols on desktop */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4 lg:gap-5">
          {/* First project - takes full width on first row */}
          {featuredProjects[0] && (
            <Link
              href={`/projects/${featuredProjects[0].slug}`}
              className="col-span-2 group relative overflow-hidden rounded-xl bg-muted aspect-[16/9]"
            >
              <Image
                src={HERO_IMAGES[featuredProjects[0].slug as keyof typeof HERO_IMAGES]}
                alt={featuredProjects[0].title}
                fill
                priority
                placeholder="blur"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
                  {featuredProjects[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {featuredProjects[0].role} · {featuredProjects[0].year}
                </p>
              </div>
            </Link>
          )}

          {/* Second and third projects - side by side */}
          {featuredProjects.slice(1, 3).map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group relative overflow-hidden rounded-xl bg-muted aspect-[4/3]"
            >
              <Image
                src={HERO_IMAGES[project.slug as keyof typeof HERO_IMAGES]}
                alt={project.title}
                fill
                placeholder="blur"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 29vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h2 className="text-sm sm:text-base font-medium tracking-tight text-foreground line-clamp-1">
                  {project.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{project.year}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* View all projects link */}
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
