import { type Locale, routing } from '@/i18n/routing';
import { getPosts } from '@/lib/mdx/blog';
import { getProjects } from '@/lib/mdx/projects';
import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://pansarinitech.vercel.app');

const HREFLANG: Record<Locale, string> = { en: 'en', pt: 'pt-BR' };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects('en');
  const posts = await getPosts('en');

  const staticEntries = [
    { path: '', priority: 1 as const, lastModified: new Date() },
    { path: '/projects', priority: 0.8 as const, lastModified: new Date() },
    { path: '/blog', priority: 0.8 as const, lastModified: new Date() },
    { path: '/now', priority: 0.6 as const, lastModified: new Date() },
  ];

  const projectEntries = projects.map((p) => ({
    path: `/projects/${p.slug}`,
    priority: 0.6 as const,
    lastModified: new Date(`${p.year}-01-01`),
  }));

  const postEntries = posts.map((p) => ({
    path: `/blog/${p.slug}`,
    priority: 0.6 as const,
    lastModified: new Date(p.date),
  }));

  const allEntries = [...staticEntries, ...projectEntries, ...postEntries];

  return allEntries.flatMap(({ path, priority, lastModified }) =>
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
        priority,
        alternates: { languages },
      };
    }),
  );
}
