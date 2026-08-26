import { career } from '@/data/career';
import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { CareerTimeline } from './career-timeline';

describe('<CareerTimeline />', () => {
  it('renders the career heading', () => {
    render(<CareerTimeline />, { locale: 'en' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Career');
  });

  it('renders 5 career entries on desktop (horizontal scroll)', () => {
    render(<CareerTimeline />, { locale: 'en' });

    // Check for all 5 companies (both desktop horizontal + mobile vertical render)
    for (const role of career) {
      expect(screen.getAllByText(role.company).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders the pivot badge for UAUBox', () => {
    render(<CareerTimeline />, { locale: 'en' });

    const pivotBadge = screen.getByText(/IT-to-engineering pivot marker/i);
    expect(pivotBadge).toBeInTheDocument();
    expect(pivotBadge).toHaveClass('bg-primary');
  });

  it('renders in pt locale with correct heading text', () => {
    render(<CareerTimeline />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Carreira');

    const pivotBadge = screen.getByText(/Marca da virada de TI para Engenharia/i);
    expect(pivotBadge).toBeInTheDocument();
  });
});
