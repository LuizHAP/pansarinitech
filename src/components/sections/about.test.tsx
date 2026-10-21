import { render, screen, within } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { About } from './about';

describe('<About />', () => {
  it('renders the H2 section heading and cadence paragraph in en', () => {
    render(<About />, { locale: 'en' });

    const heading = screen.getByRole('heading', { level: 2, name: 'About' });
    expect(heading).toHaveAttribute('id', 'about-heading');

    expect(screen.getByText(/I update \/now when something changes/i)).toBeInTheDocument();
  });

  it('renders bio paragraphs and the photo in en', () => {
    render(<About />, { locale: 'en' });

    expect(screen.getByText(/Started in IT support at Klabin/i)).toBeInTheDocument();
    expect(screen.getByText(/Web, mobile, and the backend/i)).toBeInTheDocument();
    const photo = screen.getByRole('img', { name: "Luiz Pansarini at Galaxy's Edge" });
    expect(photo).not.toHaveAttribute('fetchpriority');
    expect(photo).toHaveAttribute('loading', 'lazy');
  });

  it('renders the stats as a labelled description list from the about stats data', () => {
    render(<About />, { locale: 'en' });

    const stats = screen.getByLabelText('At a glance');
    expect(stats.tagName).toBe('DL');
    const terms = within(stats).getAllByRole('term');
    expect(terms.map((term) => term.textContent)).toEqual([
      'years in tech',
      'companies',
      'markets',
      'users reached',
    ]);
    expect(
      within(stats)
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['14', '5', 'BR+US', '100M+']);
  });

  it('renders Portuguese content when locale=pt', () => {
    render(<About />, { locale: 'pt' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sobre');
    expect(screen.getByText(/Atualizo \/now quando algo muda/i)).toBeInTheDocument();
    expect(screen.getByText(/Comecei em suporte de TI na Klabin/i)).toBeInTheDocument();
    expect(screen.getByText('anos em tech')).toBeInTheDocument();
    expect(screen.getByLabelText('Em números')).toBeInTheDocument();
  });
});
