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

// PHASE 5: do not enable experimental.viewTransition.
// Manual document.startViewTransition() in src/components/shared/theme-toggle.tsx
// (CONTEXT D-01..D-05) would be interrupted by React's <ViewTransition> component
// if this flag were on. See .planning/phases/05-hardening-optional-post-launch/
// 05-RESEARCH.md §Pitfall 1 (and react.dev/reference/react/ViewTransition).
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
