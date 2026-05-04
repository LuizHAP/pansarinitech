import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';
import { Contact } from './contact';

// CopyEmailButton uses navigator.clipboard and sonner toast — mock sonner to avoid toast portal errors
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

describe('<Contact />', () => {
  it('renders the email mailto link', () => {
    render(<Contact />, { locale: 'en' });

    const emailLink = screen.getByRole('link', { name: /lpansarini@gmail\.com/i });
    expect(emailLink.getAttribute('href')).toMatch(/^mailto:/);
    expect(emailLink.getAttribute('href')).toContain('lpansarini@gmail.com');
  });

  it('renders LinkedIn and GitHub links with noopener noreferrer', () => {
    render(<Contact />, { locale: 'en' });

    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink.getAttribute('rel')).toContain('noopener');
    expect(linkedinLink.getAttribute('rel')).toContain('noreferrer');

    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink.getAttribute('rel')).toContain('noopener');
    expect(githubLink.getAttribute('rel')).toContain('noreferrer');
  });

  it('renders resume download link with correct locale-aware href', () => {
    render(<Contact />, { locale: 'en' });
    const resumeLinks = screen.getAllByRole('link');
    const resumeLink = resumeLinks.find((el) => el.getAttribute('download') !== null);
    expect(resumeLink).toBeDefined();
    expect(resumeLink?.getAttribute('href')).toMatch(/Luiz-Pansarini-Resume\.pdf$/);
  });

  it('renders PT locale contact title and resume link', () => {
    render(<Contact />, { locale: 'pt' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Entre em contato');

    const resumeLinks = screen.getAllByRole('link');
    const resumeLink = resumeLinks.find((el) => el.getAttribute('download') !== null);
    expect(resumeLink?.getAttribute('href')).toMatch(/Luiz-Pansarini-Curriculo\.pdf$/);
  });
});
