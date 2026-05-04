import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { Hero } from './hero';

// next/image in jsdom: Vitest transforms it fine; static imports return an object with `src`.
// The luiz.jpg static import in hero.tsx resolves to the image file — mock it so jsdom doesn't
// attempt to fetch it.
vi.mock('../../../public/luiz.jpg', () => ({
  default: { src: '/luiz.jpg', width: 768, height: 1024, blurDataURL: 'data:image/png;base64,xx' },
}));

describe('<Hero />', () => {
  it('renders the H1 and both CTAs in en locale', () => {
    render(<Hero />, { locale: 'en' });

    // H1 heading must be present
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Luiz Pansarini');

    // Contact CTA anchors to #contact section
    const contactCta = screen.getByRole('link', { name: /Contact/i });
    expect(contactCta).toHaveAttribute('href', '#contact');

    // Resume CTA has download attribute pointing to the EN PDF
    const resumeCta = screen.getByRole('link', { name: /Resume/i });
    expect(resumeCta).toHaveAttribute('download');
    expect(resumeCta.getAttribute('href')).toMatch(/Luiz-Pansarini-Resume\.pdf$/);
  });

  it('renders the pt locale resume label and href', () => {
    render(<Hero />, { locale: 'pt' });

    // PT label for resume is "Currículo"
    const resumeCta = screen.getByRole('link', { name: /Currículo/i });
    expect(resumeCta).toHaveAttribute('download');
    expect(resumeCta.getAttribute('href')).toMatch(/Luiz-Pansarini-Curriculo\.pdf$/);

    // Contact CTA in pt locale is "Contato"
    const contactCta = screen.getByRole('link', { name: /Contato/i });
    expect(contactCta).toHaveAttribute('href', '#contact');
  });

  it('renders the hero photo with an accessible alt text', () => {
    render(<Hero />, { locale: 'en' });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', expect.stringContaining('Luiz Pansarini'));
  });
});
