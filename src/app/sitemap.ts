import { type Locale, routing } from '@/i18n/routing';
import { getPosts } from '@/lib/mdx/blog';
import { getAllSlugs as getAllProjectSlugs } from '@/lib/mdx/projects';
// src/app/sitemap.ts — Phase 4 D-31, SEO-04, I18N-05
//
// Multi-locale sitemap with xhtml:link hreflang reciprocity (en + pt-BR + x-default).
// Drafts excluded via getPosts (NODE_ENV gate from Plan 04-01) — preview AND
// production builds run NODE_ENV='production' so drafts hide on both.
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarinitech.vercel.app';

const HREFLANG: Record<Locale, string> = { en: 'en', pt: 'pt-BR' };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectSlugs = await getAllProjectSlugs();
  // getPosts applies the NODE_ENV draft filter — production sitemaps exclude drafts.
  const postsEn = await getPosts('en');
  const postSlugs = postsEn.map((p) => p.slug);

  const staticPaths = ['', '/projects', '/blog', '/now'];
  const dynamicPaths = [
    ...projectSlugs.map((s) => `/projects/${s}`),
    ...postSlugs.map((s) => `/blog/${s}`),
  ];

  const allPaths = [...staticPaths, ...dynamicPaths];
  const lastModified = new Date();

  return allPaths.flatMap((path) =>
    routing.locales.map((locale) => {
      const url = `${SITE_URL}/${locale}${path}`;
      const languages: Record<string, string> = {};
      for (const l of routing.locales) {
        languages[HREFLANG[l]] = `${SITE_URL}/${l}${path}`;
      }
      languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;

      return {
        url,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: path === '' ? 1 : path === '/blog' || path === '/projects' ? 0.8 : 0.6,
        alternates: { languages },
      };
    }),
  );
}
