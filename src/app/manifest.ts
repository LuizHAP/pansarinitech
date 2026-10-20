// No service worker on purpose: the manifest only exists for home-screen icons and
// Lighthouse's PWA-adjacent checks.
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Luiz Pansarini',
    short_name: 'LP',
    description: 'Luiz Pansarini — Principal Software Engineer (Brazil/US)',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E0F0C',
    theme_color: '#0E0F0C',
    icons: [
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/pansarini-mark.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
