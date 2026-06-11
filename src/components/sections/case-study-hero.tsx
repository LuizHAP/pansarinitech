import { Badge } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import type { Project } from '@/lib/mdx/schema';
import { getTranslations } from 'next-intl/server';
// src/components/sections/case-study-hero.tsx — Phase 3 D-23
// Page-template Hero (NOT MDX) — heroImage via static-import switch
// (Open Question #3 → option (a)). 3 imports = 3 case studies; adding a 4th
// case requires editing HERO_IMAGES below in the same PR.
import Image, { type StaticImageData } from 'next/image';
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';
// Static-imported hero images. blurDataURL is auto-generated at build time
// by Next.js's static-import path (Phase 2 hero.tsx pattern).
import machineryEcommerce from '../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../content/projects/magazine-luiza-superapp/images/hero.jpg';
import uauboxHero from '../../../content/projects/uaubox-design-system/images/hero.jpg';

const HERO_IMAGES: Record<string, StaticImageData> = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'uaubox-design-system': uauboxHero,
  'machinery-mobile-first': machineryMobileFirst,
};

export async function CaseStudyHero({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'projects' });
  const heroSrc = HERO_IMAGES[project.slug];
  if (!heroSrc) {
    // Build-time guard: if a slug is added without registering its image, fail loudly.
    throw new Error(
      `[case-study-hero] No hero image registered for slug '${project.slug}'. Add it to HERO_IMAGES in src/components/sections/case-study-hero.tsx.`,
    );
  }
  return (
    <header className="mx-auto max-w-3xl px-4 pt-8">
      <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
        {t('cta.backToProjects')}
      </Link>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
      <p className="mt-2 text-base text-muted-foreground">
        {project.role} · {project.year}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {project.stack.slice(0, 8).map((tech) => (
          <Badge key={tech} variant="secondary">
            {tech}
          </Badge>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border bg-muted">
        <Image
          src={heroSrc}
          alt={project.title}
          sizes="(max-width: 768px) 100vw, 80vw"
          priority
          fetchPriority="high"
          placeholder="blur"
          className="h-auto w-full"
        />
      </div>
    </header>
  );
}
