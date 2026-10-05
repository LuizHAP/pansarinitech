import { render, screen } from '@/test/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock static image imports BEFORE component import.
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

let mockLocale = 'en';

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(async () => mockLocale),
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const enCatalog: Record<string, Record<string, string>> = {
      hero: {
        contactCta: 'Contact',
        resumeCta: 'Resume',
        photoAlt: "Luiz Pansarini at Galaxy's Edge",
      },
      projects: {
        'cta.viewAll': 'View all projects →',
      },
    };
    const ptCatalog: Record<string, Record<string, string>> = {
      hero: {
        contactCta: 'Contato',
        resumeCta: 'Currículo',
        photoAlt: "Luiz Pansarini no Galaxy's Edge",
      },
      projects: {
        'cta.viewAll': 'Ver todos os projetos →',
      },
    };
    const catalog = mockLocale === 'pt' ? ptCatalog : enCatalog;
    return (key: string) => catalog[namespace]?.[key] ?? key;
  }),
}));

vi.mock('@/lib/mdx/projects', () => ({
  getProjects: vi.fn(async () => [
    {
      slug: 'machinery-partner-ecommerce',
      title: 'Heavy Machinery e-commerce',
      role: 'Principal Software Engineer',
      year: 2024,
      blurb: 'First transactional storefront for US heavy machinery.',
      featured: true,
      order: 1,
    },
    {
      slug: 'machinery-partner-migration',
      title: 'No-Code to Next.js Migration',
      role: 'Lead Engineer',
      year: 2023,
      blurb: 'No-code to Next.js migration.',
      featured: true,
      order: 2,
    },
    {
      slug: 'magazine-luiza-superapp',
      title: 'Magazine Luiza Superapp',
      role: 'Software Engineer',
      year: 2021,
      blurb: 'React Native superapp.',
      featured: true,
      order: 3,
    },
  ]),
}));

import { Hero } from './hero';

describe('<Hero />', () => {
  beforeEach(() => {
    mockLocale = 'en';
  });

  it('renders the H1 and both CTAs in en locale', async () => {
    const ui = await Hero();
    render(ui, { locale: 'en' });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Luiz Pansarini');

    const contactCta = screen.getByRole('link', { name: /Contact/i });
    expect(contactCta).toHaveAttribute('href', '#contact');

    const resumeCta = screen.getByRole('link', { name: /Resume/i });
    expect(resumeCta).toHaveAttribute('download');
    expect(resumeCta.getAttribute('href')).toMatch(/Luiz-Pansarini_Resume\.pdf$/);
  });

  it('renders the pt locale resume label and href', async () => {
    mockLocale = 'pt';
    const ui = await Hero();
    render(ui, { locale: 'pt' });

    const resumeCta = screen.getByRole('link', { name: /Currículo/i });
    expect(resumeCta).toHaveAttribute('download');
    expect(resumeCta.getAttribute('href')).toMatch(/Luiz-Pansarini_Curriculo\.pdf$/);

    const contactCta = screen.getByRole('link', { name: /Contato/i });
    expect(contactCta).toHaveAttribute('href', '#contact');
  });

  it('renders the role/value-prop text', async () => {
    const ui = await Hero();
    render(ui, { locale: 'en' });
    expect(screen.getByText(/Principal Software Engineer · Brazil/i)).toBeInTheDocument();
    expect(screen.getByText(/IT helpdesk at Klabin to Principal Engineer/i)).toBeInTheDocument();
  });

  it('renders 3 featured project cards with thumbnails', async () => {
    const ui = await Hero();
    render(ui, { locale: 'en' });

    expect(screen.getByText('Heavy Machinery e-commerce')).toBeInTheDocument();
    expect(screen.getByText('No-Code to Next.js Migration')).toBeInTheDocument();
    expect(screen.getByText('Magazine Luiza Superapp')).toBeInTheDocument();
  });

  it('renders View all projects link', async () => {
    const ui = await Hero();
    render(ui, { locale: 'en' });

    expect(screen.getByRole('link', { name: /View all projects/i })).toBeInTheDocument();
  });
});
