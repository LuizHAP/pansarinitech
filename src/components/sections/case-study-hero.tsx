import { BrowserFrame } from '@/components/site';
import { sectionContainer } from '@/components/ui';
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
  const t = await getTranslations({ locale });
  const heroSrc = HERO_IMAGES[project.slug];
  if (!heroSrc) {
    // Build-time guard: if a slug is added without registering its image, fail loudly.
    throw new Error(
      `[case-study-hero] No hero image registered for slug '${project.slug}'. Add it to HERO_IMAGES in src/components/sections/case-study-hero.tsx.`,
    );
  }
  return (
    <header className="surface-ink">
      <div className={`${sectionContainer} pt-14 pb-16 md:pt-20 md:pb-24`}>
        <Link
          href="/projects"
          className="font-mono text-sm text-ink-muted underline decoration-signal-soft decoration-2 underline-offset-4 hover:text-paper"
        >
          {t('site.pages.backToProjects')}
        </Link>
        <p className="mt-10 font-mono text-sm text-ink-muted">
          {project.role} · {project.year}
        </p>
        <h1 className="mt-4 max-w-5xl font-display text-[clamp(40px,6vw,84px)] leading-[0.95] font-extrabold tracking-[-0.045em] text-balance [overflow-wrap:anywhere]">
          {project.title}
        </h1>
        <ul className="mt-6 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[13px] text-ink-body">
          {project.stack.slice(0, 8).map((tech, index) => (
            <li key={tech} className="flex gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-signal-soft">
                  ·
                </span>
              )}
              <span>{tech}</span>
            </li>
          ))}
        </ul>
        <BrowserFrame url={`pansarini.tech/projects/${project.slug}`} className="mt-12 max-w-5xl">
          <Image
            src={heroSrc}
            alt={project.title}
            width={1024}
            height={640}
            sizes="(max-width: 1088px) 100vw, 1024px"
            priority
            fetchPriority="high"
            placeholder="blur"
            className="h-auto w-full"
          />
        </BrowserFrame>
      </div>
    </header>
  );
}
