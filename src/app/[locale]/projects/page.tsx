import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import { getProjects } from '@/lib/mdx/projects';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  return buildMetadata({
    locale,
    path: '/projects',
    title: t('title'),
    description: t('listingDescription'),
  });
}
// src/app/[locale]/projects/page.tsx — Phase 3 D-21, D-22
// Listing page — RSC. Stays ● SSG via setRequestLocale + frontmatter-only
// loader.getProjects(locale). Cards link via @/lib/i18n/navigation Link to
// preserve the locale prefix on the slug route.
import Image from 'next/image';
import machineryEcommerce from '../../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../../content/projects/magazine-luiza-superapp/images/hero.jpg';

const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
} as const;

export default async function ProjectsListingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'projects' });
  const projects = await getProjects(locale);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">{t('listingIntro')}</p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/projects/${p.slug}`}
              className="block transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Card className="h-full overflow-hidden">
                <div className="aspect-[16/10] w-full bg-muted">
                  <Image
                    src={HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]}
                    alt={p.title}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    placeholder="blur"
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {p.role} · {p.year}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 5).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{p.blurb}</p>
                  <p className="mt-4 text-sm font-semibold text-foreground underline-offset-4 group-hover/card:underline">
                    {t('cta.readMore')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
