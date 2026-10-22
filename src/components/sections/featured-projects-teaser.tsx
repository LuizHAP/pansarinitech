import { BrowserCard, SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import { getProjects } from '@/lib/mdx/projects';
import { getTranslations } from 'next-intl/server';
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';
import machineryEcommerce from '../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../content/projects/magazine-luiza-superapp/images/hero.jpg';
import uauboxDesignSystem from '../../../content/projects/uaubox-design-system/images/hero.jpg';

export const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'machinery-mobile-first': machineryMobileFirst,
  'uaubox-design-system': uauboxDesignSystem,
} as const;

const linkClass =
  'font-mono text-sm text-paper underline decoration-signal-soft decoration-2 underline-offset-4 hover:decoration-paper';

export async function FeaturedProjectsTeaser({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const all = await getProjects(locale);
  const featured = all.filter((p) => p.featured).slice(0, 3);

  return (
    <Section id="projects" ariaLabelledBy="featured-projects-heading" surface="ink">
      <SectionHead
        id="featured-projects-heading"
        title={t('sections.featuredProjects')}
        comment={t('site.sections.projectsComment')}
      />

      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <Link href="/projects" className={linkClass}>
          {t('projects.cta.viewAll')}
        </Link>
        <span aria-hidden="true" className="text-ink-muted">
          ·
        </span>
        <Link href="/blog" className={linkClass}>
          {t('projects.cta.readBlog')}
        </Link>
      </div>

      <div className="mt-14 grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-7">
        {featured.map((p, index) => (
          <BrowserCard
            key={p.slug}
            href={`/projects/${p.slug}`}
            url={`pansarini.dev/projects/${p.slug}`}
            title={p.title}
            meta={`${p.role} · ${p.year}`}
            image={HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]}
            alt=""
            eager={index === 0}
          />
        ))}
      </div>
    </Section>
  );
}
