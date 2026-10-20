import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';

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

vi.mock('../../../content/projects/machinery-mobile-first/images/hero.jpg', () => ({
  default: { src: '/x.jpg', width: 1200, height: 750, blurDataURL: 'data:image/png;base64,xx' },
}));
vi.mock('../../../content/projects/uaubox-design-system/images/hero.jpg', () => ({
  default: { src: '/x.jpg', width: 1200, height: 750, blurDataURL: 'data:image/png;base64,xx' },
}));

vi.mock('next-intl/server', async () => {
  const en = (await import('../../../messages/en.json')).default;
  const lookup = (path: string): unknown =>
    path
      .split('.')
      .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], en);
  return {
    getTranslations: vi.fn(async () => (key: string) => String(lookup(key) ?? key)),
  };
});

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
  it('renders the section heading with its terminal comment', async () => {
    render(await FeaturedProjectsTeaser({ locale: 'en' }), { locale: 'en' });

    const heading = screen.getByRole('heading', { level: 2, name: 'Featured projects' });
    expect(heading).toHaveAttribute('id', 'featured-projects-heading');
    expect(screen.getByText('$ ls ~/projects')).toBeInTheDocument();
  });

  it('renders each featured project as a browser card linking to its case study', async () => {
    render(await FeaturedProjectsTeaser({ locale: 'en' }), { locale: 'en' });

    const card = screen.getByRole('link', { name: /Ecommerce Platform/ });
    expect(card).toHaveAttribute('href', '/en/projects/machinery-partner-ecommerce');
    expect(card).toHaveTextContent('pansarini.tech/projects/machinery-partner-ecommerce');
    expect(card).toHaveTextContent('Lead · 2024');
    expect(
      screen.getByRole('heading', { level: 3, name: 'No-Code Migration' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Luiza Superapp' })).toBeInTheDocument();
  });

  it('loads only the first card image eagerly and never with fetch priority', async () => {
    const { container } = render(await FeaturedProjectsTeaser({ locale: 'en' }), {
      locale: 'en',
    });

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'lazy');
    expect(container.querySelector('[fetchpriority]')).toBeNull();
  });

  it('renders View all and Read blog links to the localized routes', async () => {
    render(await FeaturedProjectsTeaser({ locale: 'en' }), { locale: 'en' });

    expect(screen.getByRole('link', { name: /View all projects/i })).toHaveAttribute(
      'href',
      '/en/projects',
    );
    expect(screen.getByRole('link', { name: /Read the blog/i })).toHaveAttribute(
      'href',
      '/en/blog',
    );
  });
});
