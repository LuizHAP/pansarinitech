// Tests for CaseStudyHero async RSC component.
// Mocks: next/image, @/lib/i18n/navigation (Link), the 3 static hero images,
// and getTranslations from next-intl/server.
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (
    props: {
      src: { src?: string } | string;
      alt: string;
    } & Record<string, unknown>,
  ) => {
    const src = typeof props.src === 'string' ? props.src : (props.src?.src ?? '');
    return <img src={src} alt={props.alt} />;
  },
}));

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('../../../content/projects/machinery-partner-ecommerce/images/hero.jpg', () => ({
  default: {
    src: '/hero-ecom.jpg',
    width: 1200,
    height: 630,
    blurDataURL: 'data:image/png;base64,xx',
  },
}));

vi.mock('../../../content/projects/machinery-partner-migration/images/hero.jpg', () => ({
  default: {
    src: '/hero-mig.jpg',
    width: 1200,
    height: 630,
    blurDataURL: 'data:image/png;base64,xx',
  },
}));

vi.mock('../../../content/projects/magazine-luiza-superapp/images/hero.jpg', () => ({
  default: {
    src: '/hero-magalu.jpg',
    width: 1200,
    height: 630,
    blurDataURL: 'data:image/png;base64,xx',
  },
}));

import enMessages from '../../../messages/en.json';
import ptMessages from '../../../messages/pt.json';

vi.mock('next-intl/server', () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: 'en' | 'pt';
    namespace: string;
  }) => {
    const msgs = (locale === 'pt' ? ptMessages : enMessages) as Record<string, unknown>;
    const ns = msgs[namespace] as Record<string, unknown>;
    return (key: string) => {
      // dotted key lookup, e.g. 'cta.backToProjects'
      return key
        .split('.')
        .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], ns) as string;
    };
  },
}));

import type { Project } from '@/lib/mdx/schema';
import { render, screen } from '@/test/render';

const baseProject: Project = {
  title: 'Machinery Partner E-commerce',
  role: 'Principal Software Engineer',
  year: 2024,
  stack: ['Next.js', 'TypeScript', 'Tailwind', 'Postgres', 'Vercel'],
  blurb: 'A short blurb that easily exceeds the twenty character minimum length.',
  heroImage: 'hero.jpg',
  tags: [],
  featured: true,
  order: 1,
  slug: 'machinery-partner-ecommerce',
  readingTime: { minutes: 5 },
};

describe('<CaseStudyHero />', () => {
  it('Test 1 (EN, valid slug): renders h1 title, role/year, badges, back link, and hero image', async () => {
    const { CaseStudyHero } = await import('./case-study-hero');
    const jsx = await CaseStudyHero({ project: baseProject, locale: 'en' });
    render(jsx, { locale: 'en' });

    // h1 title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(baseProject.title);

    // role · year line
    expect(screen.getByText(`${baseProject.role} · ${baseProject.year}`)).toBeInTheDocument();

    // stack badges (all 5 in this fixture — fewer than the 8-badge cap)
    for (const tech of baseProject.stack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }

    // back link
    const backLink = screen.getByRole('link', { name: /Back to projects/i });
    expect(backLink).toBeInTheDocument();

    // hero image (mocked next/image renders <img>)
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', baseProject.title);
  });

  it('Test 2 (PT locale): back-link text uses the PT translation', async () => {
    const { CaseStudyHero } = await import('./case-study-hero');
    const jsx = await CaseStudyHero({ project: baseProject, locale: 'pt' });
    render(jsx, { locale: 'pt' });

    // PT translation for cta.backToProjects is "← Voltar aos projetos"
    expect(screen.getByRole('link', { name: /Voltar aos projetos/i })).toBeInTheDocument();
  });

  it('Test 3 (unknown slug): throws with a descriptive error', async () => {
    const { CaseStudyHero } = await import('./case-study-hero');

    await expect(
      CaseStudyHero({
        project: { ...baseProject, slug: 'nope' },
        locale: 'en',
      }),
    ).rejects.toThrow(/No hero image registered/);
  });
});
