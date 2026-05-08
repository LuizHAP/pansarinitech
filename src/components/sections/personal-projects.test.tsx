import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { PersonalProjects } from './personal-projects';

describe('<PersonalProjects />', () => {
  it('renders the section heading in en locale', () => {
    render(<PersonalProjects />, { locale: 'en' });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Personal projects');
  });

  it('renders the section heading in pt locale', () => {
    render(<PersonalProjects />, { locale: 'pt' });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Projetos pessoais');
  });

  it('renders all five project cards', () => {
    render(<PersonalProjects />, { locale: 'en' });
    // Starlimp has a screenshot so its name appears only in CardTitle.
    // Projects without screenshots also show the name in the placeholder span,
    // so we use getAllByText and assert at least one match per project.
    expect(screen.getAllByText('Starlimp Jundiaí').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('DoAção').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('NotificaMe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MTG Price Monitor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Redzone Boss').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Live" badge for starlimp and "In development" for others in en locale', () => {
    render(<PersonalProjects />, { locale: 'en' });
    expect(screen.getByText('Live')).toBeInTheDocument();
    const inDevBadges = screen.getAllByText('In development');
    expect(inDevBadges.length).toBe(4);
  });

  it('shows status badges in pt locale', () => {
    render(<PersonalProjects />, { locale: 'pt' });
    expect(screen.getByText('No ar')).toBeInTheDocument();
    expect(screen.getAllByText('Em desenvolvimento').length).toBe(4);
  });

  it('renders a "Visit site" link for starlimp pointing to the vercel deployment', () => {
    render(<PersonalProjects />, { locale: 'en' });
    const links = screen.getAllByRole('link', { name: /Visit site Starlimp Jundiaí/i });
    expect(links[0]).toHaveAttribute('href', 'https://starlimp-jundiai.vercel.app');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders GitHub links for all projects', () => {
    render(<PersonalProjects />, { locale: 'en' });
    const githubLinks = screen.getAllByRole('link', { name: /View code/i });
    expect(githubLinks.length).toBe(5);
    for (const link of githubLinks) {
      expect(link).toHaveAttribute('href', expect.stringContaining('github.com'));
    }
  });
});
