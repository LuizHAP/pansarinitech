// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Phase 1: minimal config. No images.remotePatterns, no experimental flags.
};

export default withNextIntl(nextConfig);
