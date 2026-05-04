import { aboutStats } from '@/data/about-stats';
import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { About } from './about';

describe('<About />', () => {
  it('renders the H2 section heading and cadence paragraph in en', () => {
    render(<About />, { locale: 'en' });

    // H2 heading with correct id
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'about-heading');

    // Cadence paragraph (italic text at bottom of section)
    expect(screen.getByText(/I update \/now when something changes/i)).toBeInTheDocument();
  });

  it('renders all 4 stat cards matching aboutStats length', () => {
    render(<About />, { locale: 'en' });

    // Each stat renders its num value
    for (const stat of aboutStats) {
      expect(screen.getByText(stat.num)).toBeInTheDocument();
    }
  });

  it('renders Portuguese content when locale=pt', () => {
    render(<About />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    // PT heading text is "Sobre"
    expect(heading).toHaveTextContent('Sobre');

    // Cadence paragraph in PT
    expect(screen.getByText(/Atualizo \/now quando algo muda/i)).toBeInTheDocument();
  });
});
