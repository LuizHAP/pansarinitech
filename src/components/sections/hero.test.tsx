import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';

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
    expect(resumeCta.getAttribute('href')).toMatch(/Luiz-Pansarini_Resume\.pdf$/);
  });

  it('renders the pt locale resume label and href', () => {
    render(<Hero />, { locale: 'pt' });

    // PT label for resume is "Currículo"
    const resumeCta = screen.getByRole('link', { name: /Currículo/i });
    expect(resumeCta).toHaveAttribute('download');
    expect(resumeCta.getAttribute('href')).toMatch(/Luiz-Pansarini_Curriculo\.pdf$/);

    // Contact CTA in pt locale is "Contato"
    const contactCta = screen.getByRole('link', { name: /Contato/i });
    expect(contactCta).toHaveAttribute('href', '#contact');
  });

  it('renders the role/value-prop text', () => {
    render(<Hero />, { locale: 'en' });
    // "Principal Software Engineer" appears twice: eyebrow + role line
    const matches = screen.getAllByText(/Principal Software Engineer/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/IT helpdesk at Klabin/i)).toBeInTheDocument();
  });

  it('renders terminal visual on desktop', () => {
    render(<Hero />, { locale: 'en' });
    expect(screen.getByText(/git log --oneline -5/i)).toBeInTheDocument();
    expect(screen.getByText(/Build successful/i)).toBeInTheDocument();
  });
});
