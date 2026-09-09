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

  it('renders bio paragraphs in en', () => {
    render(<About />, { locale: 'en' });

    expect(screen.getByText(/I started in IT support at Klabin/i)).toBeInTheDocument();
    expect(screen.getByText(/At Machinery Partner I led/i)).toBeInTheDocument();
  });

  it('renders Portuguese content when locale=pt', () => {
    render(<About />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Sobre');

    expect(screen.getByText(/Atualizo \/now quando algo muda/i)).toBeInTheDocument();
    expect(screen.getByText(/Comecei em suporte de TI na Klabin/i)).toBeInTheDocument();
  });
});
