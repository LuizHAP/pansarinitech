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

  it('renders an OL with the correct number of career entries', () => {
    render(<CareerTimeline />, { locale: 'en' });

    // The ordered list has aria-label "Career timeline"; use getByRole with name to target it
    const list = screen.getByRole('list', { name: /Career timeline/i });
    const items = list.querySelectorAll(':scope > li');
    expect(items.length).toBe(career.length);
  });

  it('renders the pivot role with role="img" and pivot aria-label', () => {
    render(<CareerTimeline />, { locale: 'en' });

    // UAUBox is the pivot role; the dot gets role="img" + aria-label
    const pivotDot = screen.getByRole('img', { name: /IT-to-engineering pivot marker/i });
    expect(pivotDot).toBeInTheDocument();
  });

  it('renders in pt locale with correct heading text', () => {
    render(<CareerTimeline />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Carreira');

    // PT pivot label
    const pivotDot = screen.getByRole('img', { name: /Marca da virada/i });
    expect(pivotDot).toBeInTheDocument();
  });
});
