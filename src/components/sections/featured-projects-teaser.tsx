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
      width="wide"
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

      <RevealGroup className="grid gap-4 grid-cols-1 lg:grid-cols-3" stagger={0.06}>
        {featured.map((p, index) => {
          const isFeatured = index === 0;
          const inner = (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="group block relative overflow-hidden transition-colors"
            >
              <article className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]}
                  alt={p.title}
                  sizes={
                    isFeatured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'
                  }
                  priority={isFeatured}
                  fetchPriority={isFeatured ? 'high' : 'auto'}
                  placeholder="blur"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-lg font-medium tracking-tight">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.role} · {p.year}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.blurb}</p>
                </div>
              </article>
            </Link>
          );

          if (isFeatured) {
            return (
              <RevealItem key={p.slug} className="lg:col-span-2">
                {inner}
              </RevealItem>
            );
          }
          return <RevealItem key={p.slug}>{inner}</RevealItem>;
        })}
      </RevealGroup>
    </Section>
  );
}
