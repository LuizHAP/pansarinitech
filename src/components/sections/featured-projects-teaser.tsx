import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import { getProjects } from '@/lib/mdx/projects';
import { getTranslations } from 'next-intl/server';
// src/components/sections/featured-projects-teaser.tsx — Phase 3 D-24
// REWRITE of Phase 2 placeholder — async RSC consuming real getProjects(locale).
// Critical: async RSC cannot read the locale via the client hook (Pitfall 8); locale is a prop.
import Image from 'next/image';
import machineryEcommerce from '../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../content/projects/magazine-luiza-superapp/images/hero.jpg';

const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
} as const;

export async function FeaturedProjectsTeaser({ locale }: { locale: Locale }) {
  const tSec = await getTranslations({ locale, namespace: 'sections' });
  const tProj = await getTranslations({ locale, namespace: 'projects' });
  const all = await getProjects(locale);
  const featured = all.filter((p) => p.featured).slice(0, 3);

  return (
    <section
      id="projects"
      aria-labelledby="featured-projects-heading"
      className="mx-auto max-w-5xl px-4 py-12"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="featured-projects-heading" className="text-2xl font-semibold tracking-tight">
          {tSec('featuredProjects')}
        </h2>
        <Link
          href="/projects"
          className="text-sm font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          {tProj('cta.viewAll')}
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="block transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Card className="h-full overflow-hidden">
              <div className="aspect-[16/10] w-full bg-muted">
                <Image
                  src={HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]}
                  alt={p.title}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  placeholder="blur"
                  className="h-full w-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {p.role} · {p.year}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.blurb}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
