// src/app/robots.ts — Phase 4 D-32, SEO-05
//
// Allow production crawl; disallow on preview/dev. Vercel automatically sets
// X-Robots-Tag: noindex on *.vercel.app preview URLs; this is the additional
// layer of correctness in robots.txt itself (defense-in-depth alongside
// next.config.ts headers() and src/lib/seo.ts robots-meta).
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarinitech.vercel.app';

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production';
  return {
    rules: isProduction ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
