import { getPosts } from '@/lib/mdx/blog';
import { getProjects } from '@/lib/mdx/projects';
import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://pansarini.dev');

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

  return allEntries.map(({ path, priority, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority,
  }));
}
