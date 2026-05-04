import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { Footer } from './footer';

describe('<Footer />', () => {
  it('renders the copyright text', () => {
    render(<Footer />, { locale: 'en' });

    expect(screen.getByText(/© 2026 Luiz Pansarini/i)).toBeInTheDocument();
  });

  it('renders the Source link pointing to the repo with noopener noreferrer', () => {
    render(<Footer />, { locale: 'en' });

    const sourceLink = screen.getByRole('link', { name: /Source on GitHub/i });
    expect(sourceLink).toHaveAttribute('href', 'https://github.com/LuizHAP/pansarinitech');
    expect(sourceLink).toHaveAttribute('target', '_blank');
    expect(sourceLink.getAttribute('rel')).toContain('noopener');
    expect(sourceLink.getAttribute('rel')).toContain('noreferrer');
  });

  it('renders GitHub and LinkedIn icon links with aria-labels and target="_blank"', () => {
    render(<Footer />, { locale: 'en' });

    const githubLink = screen.getByRole('link', { name: /Source code on GitHub/i });
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink.getAttribute('rel')).toContain('noopener');

    const linkedinLink = screen.getByRole('link', { name: /LinkedIn/i });
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink.getAttribute('rel')).toContain('noopener');
  });

  it('renders PT locale footer text', () => {
    render(<Footer />, { locale: 'pt' });

    expect(screen.getByText(/Construído com Next\.js/i)).toBeInTheDocument();
    // Use exact name for the "Source" text link (pt: "Código fonte no GitHub" without suffix)
    // vs the icon link whose aria-label includes "(abre em nova aba)"
    const sourceLinks = screen.getAllByRole('link', { name: /Código fonte no GitHub/i });
    expect(sourceLinks.length).toBeGreaterThanOrEqual(1);
    // At least one points to the repo
    const repoLink = sourceLinks.find(
      (el) => el.getAttribute('href') === 'https://github.com/LuizHAP/pansarinitech',
    );
    expect(repoLink).toBeDefined();
  });
});
