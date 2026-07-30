// src/app/manifest.ts — Phase 4 D-26, D-27, SEO-06
//
// MetadataRoute.Manifest — name, short_name, theme_color saber-blue, icons
// array. NO service worker (D-27); manifest exists for Lighthouse PWA-adjacent
// score boosts and recognizable home-screen icons only.
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Luiz Pansarini',
    short_name: 'LP',
    description: 'Luiz Pansarini — Principal Software Engineer (Brazil/US)',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfbfd',
    theme_color: '#0072d5',
    icons: [
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/pansarini-mark.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
