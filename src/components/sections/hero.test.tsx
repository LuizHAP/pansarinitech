import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';

// Static image mock — must be hoisted before component import.
vi.mock('../../../public/luiz.jpg', () => ({
  default: { src: '/luiz.jpg', width: 768, height: 1024, blurDataURL: 'data:image/png;base64,xx' },
}));

import { Hero } from './hero';

describe('<Hero />', () => {
  it('renders the H1 and both CTAs in en locale', () => {
    render(<Hero />, { locale: 'en' });

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

  it('renders the role/value-prop text', () => {
    render(<Hero />, { locale: 'en' });
    // Value proposition paragraph from hero data
    expect(screen.getByText(/Principal Software Engineer/i)).toBeInTheDocument();
  });
});
