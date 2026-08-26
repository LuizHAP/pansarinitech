import { aboutBullets, aboutStats } from '@/data/about-stats';
import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { About } from './about';

describe('<About />', () => {
  it('renders the H2 section heading and cadence paragraph in en', () => {
    render(<About />, { locale: 'en' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'about-heading');

    expect(screen.getByText(/I update \/now when something changes/i)).toBeInTheDocument();
  });

  it('renders all stat key/value pairs matching aboutStats length', () => {
    render(<About />, { locale: 'en' });

    for (const stat of aboutStats) {
      expect(screen.getByText(stat.num)).toBeInTheDocument();
      expect(screen.getByText(stat.label.en)).toBeInTheDocument();
    }
  });

  it('renders all bullet highlights', () => {
    render(<About />, { locale: 'en' });

    for (const bullet of aboutBullets) {
      expect(screen.getByText(bullet.text.en)).toBeInTheDocument();
    }
  });

  it('renders Portuguese content when locale=pt', () => {
    render(<About />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Sobre');

    expect(screen.getByText(/Atualizo \/now quando algo muda/i)).toBeInTheDocument();

    for (const stat of aboutStats) {
      expect(screen.getByText(stat.label.pt)).toBeInTheDocument();
    }
  });
});
