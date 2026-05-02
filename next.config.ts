// next.config.ts — Phase 3
import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Phase 1 baseline preserved — no images.remotePatterns needed (all images are
  // local static imports through next/image), no experimental flags.
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
