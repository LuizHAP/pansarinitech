import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { SkipToContent } from './skip-to-content';

describe('<SkipToContent />', () => {
  it('renders a link pointing to #main-content', () => {
    render(<SkipToContent />, { locale: 'en' });

    const link = screen.getByRole('link', { name: /Skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('has the sr-only class as the a11y contract', () => {
    render(<SkipToContent />, { locale: 'en' });

    const link = screen.getByRole('link', { name: /Skip to main content/i });
    // sr-only is the a11y contract — visually hidden at rest, visible on focus
    expect(link.className).toContain('sr-only');
  });

  it('renders PT locale text', () => {
    render(<SkipToContent />, { locale: 'pt' });

    const link = screen.getByRole('link', { name: /Pular para o conteúdo principal/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });
});
