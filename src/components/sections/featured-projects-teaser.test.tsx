import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/render';

// Mock static image imports BEFORE component import.
// NOTE: vi.mock factories are hoisted — do NOT reference top-level variables inside them.
vi.mock('../../../content/projects/machinery-partner-ecommerce/images/hero.jpg', () => ({
  default: { src: '/x.jpg', width: 1200, height: 750, blurDataURL: 'data:image/png;base64,xx' },
}));
vi.mock('../../../content/projects/machinery-partner-migration/images/hero.jpg', () => ({
  default: { src: '/x.jpg', width: 1200, height: 750, blurDataURL: 'data:image/png;base64,xx' },
}));
vi.mock('../../../content/projects/magazine-luiza-superapp/images/hero.jpg', () => ({
  default: { src: '/x.jpg', width: 1200, height: 750, blurDataURL: 'data:image/png;base64,xx' },
}));

// next-intl/server (getTranslations) is not available in jsdom — mock it to return
// a simple t(key) → string function using the en message catalog shape.
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const catalog: Record<string, Record<string, string>> = {
      sections: {
        featuredProjects: 'Featured projects',
      },
      projects: {
        'cta.viewAll': 'View all projects →',
        'cta.readBlog': 'Read the blog →',
      },
    };
    return (key: string) => catalog[namespace]?.[key] ?? key;
  }),
}));

// Mock the data loader — async function returning featured projects.
vi.mock('@/lib/mdx/projects', () => ({
  getProjects: vi.fn(async () => [
    {
      slug: 'machinery-partner-ecommerce',
      title: 'Ecommerce Platform',
      role: 'Lead',
      year: 2024,
      blurb: 'Heavy machinery ecommerce.',
      featured: true,
      order: 1,
    },
    {
      slug: 'machinery-partner-migration',
      title: 'No-Code Migration',
      role: 'Lead',
      year: 2023,
      blurb: 'No-code to Next.js migration.',
      featured: true,
      order: 2,
    },
    {
      slug: 'magazine-luiza-superapp',
      title: 'Luiza Superapp',
      role: 'Engineer',
      year: 2021,
      blurb: 'React Native superapp.',
      featured: true,
      order: 3,
    },
  ]),
}));

import { FeaturedProjectsTeaser } from './featured-projects-teaser';

describe('<FeaturedProjectsTeaser />', () => {
  it('renders the featured projects heading', async () => {
    const ui = await FeaturedProjectsTeaser({ locale: 'en' });
    render(ui, { locale: 'en' });

    expect(
      screen.getByRole('heading', { level: 2, name: /Featured projects/i }),
    ).toBeInTheDocument();
  });

  it('renders 3 project cards with titles', async () => {
    const ui = await FeaturedProjectsTeaser({ locale: 'en' });
    render(ui, { locale: 'en' });

    expect(screen.getByText('Ecommerce Platform')).toBeInTheDocument();
    expect(screen.getByText('No-Code Migration')).toBeInTheDocument();
    expect(screen.getByText('Luiza Superapp')).toBeInTheDocument();
  });

  it('renders View all and Read blog CTA links', async () => {
    const ui = await FeaturedProjectsTeaser({ locale: 'en' });
    render(ui, { locale: 'en' });

    expect(screen.getByRole('link', { name: /View all projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the blog/i })).toBeInTheDocument();
  });
});
