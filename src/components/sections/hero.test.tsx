import { render, screen } from '@/test/render';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockLocale = 'en';

vi.mock('next-intl/server', async () => {
  const en = (await import('../../../messages/en.json')).default;
  const pt = (await import('../../../messages/pt.json')).default;
  const lookup = (messages: object, path: string): unknown =>
    path
      .split('.')
      .reduce<unknown>(
        (node, key) => (node as Record<string, unknown> | undefined)?.[key],
        messages,
      );
  return {
    getLocale: vi.fn(async () => mockLocale),
    getTranslations: vi.fn(async ({ locale }: { locale: string }) => {
      const messages = locale === 'pt' ? pt : en;
      const t = (key: string) => String(lookup(messages, key) ?? key);
      t.raw = (key: string) => lookup(messages, key);
      return t;
    }),
  };
});

vi.mock('@/components/site/hero-field-scene', () => ({ mountHeroField: vi.fn() }));

import { Hero } from './hero';

describe('<Hero />', () => {
  beforeEach(() => {
    mockLocale = 'en';
  });

  it('server-renders the name as plain h1 text', async () => {
    const html = renderToStaticMarkup(await Hero());

    expect(html).toMatch(/<h1 id="hero-heading"[^>]*>Luiz Pansarini<\/h1>/);
  });

  it('renders the eyebrow, typed line, value prop and the two CTAs in en', async () => {
    render(await Hero(), { locale: 'en' });

    expect(screen.getByRole('heading', { level: 1, name: 'Luiz Pansarini' })).toBeInTheDocument();
    expect(
      screen.getByText('// principal software engineer · brazil → global'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'I build web platforms, mobile apps, design systems, APIs that scale and fast storefronts.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('web platforms')).toBeInTheDocument();
    expect(screen.getByText(/IT helpdesk at Klabin to Principal Engineer/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
    const resume = screen.getByRole('link', { name: 'Resume' });
    expect(resume).toHaveAttribute('download', 'Luiz-Pansarini_Resume.pdf');
    expect(resume.getAttribute('href')).toMatch(/Luiz-Pansarini_Resume\.pdf$/);
  });

  it('renders the pt CTAs, resume PDF and typed line', async () => {
    mockLocale = 'pt';
    render(await Hero(), { locale: 'pt' });

    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '#contact');
    const resume = screen.getByRole('link', { name: 'Currículo' });
    expect(resume).toHaveAttribute('download', 'Luiz-Pansarini_Curriculo.pdf');
    expect(resume.getAttribute('href')).toMatch(/Luiz-Pansarini_Curriculo\.pdf$/);
    expect(screen.getByText('plataformas web')).toBeInTheDocument();
  });

  it('offers the command palette hint by its accessible name', async () => {
    render(await Hero(), { locale: 'en' });

    expect(
      screen.getByRole('button', { name: 'Open the command palette (Ctrl or Cmd + K)' }),
    ).toBeInTheDocument();
  });

  it('ships no image in the hero, so nothing competes with the h1 for LCP', async () => {
    const { container } = render(await Hero(), { locale: 'en' });

    expect(container.querySelector('section#hero img')).toBeNull();
    expect(container.querySelector('[fetchpriority]')).toBeNull();
  });
});
