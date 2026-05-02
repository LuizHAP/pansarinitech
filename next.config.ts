// next.config.ts — Phase 3 baseline + Phase 4 D-32 defense-in-depth headers()
import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Phase 4: belt-and-suspenders X-Robots-Tag for non-prod environments.
// Vercel already sets X-Robots-Tag: noindex on *.vercel.app preview URLs by
// default; this also covers the case where a custom preview subdomain is
// added later (e.g. staging.pansarini.tech) — T-04-24.
const isProduction = process.env.VERCEL_ENV === 'production';

const nextConfig: NextConfig = {
  // Phase 1 baseline preserved — no images.remotePatterns needed (all images are
  // local static imports through next/image), no experimental flags.
  async headers() {
    if (isProduction) return [];
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
