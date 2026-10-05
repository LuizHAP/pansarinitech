import { RevealGroup, RevealItem, Section, SectionHeader } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import { getProjects } from '@/lib/mdx/projects';
import { getTranslations } from 'next-intl/server';
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

export async function FeaturedProjectsTeaser({ locale }: { locale: Locale }) {
  const tSec = await getTranslations({ locale, namespace: 'sections' });
  const tProj = await getTranslations({ locale, namespace: 'projects' });
  const all = await getProjects(locale);
  const featured = all.filter((p) => p.featured).slice(0, 3);

  return (
    <Section
      id="projects"
      aria-labelledby="featured-projects-heading"
      eyebrow={tProj('cta.selectedWork')}
    >
      <SectionHeader id="featured-projects-heading">{tSec('featuredProjects')}</SectionHeader>

      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
        <Link
          href="/projects"
          className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground text-sm"
        >
          {tProj('cta.viewAll')}
        </Link>
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <Link
          href="/blog"
          className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground text-sm"
        >
          {tProj('cta.readBlog')}
        </Link>
      </div>

      <RevealGroup
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        stagger={0.06}
      >
        {featured.map((p) => (
          <RevealItem key={p.slug}>
            <Link
              href={`/projects/${p.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  placeholder="blur"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <article className="flex flex-1 flex-col gap-1.5 p-5">
                <h3 className="text-lg font-medium tracking-tight text-foreground">{p.title}</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.role} · {p.year}
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {p.blurb}
                </p>
              </article>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
