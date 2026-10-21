import { career } from '@/data/career';
import { render, screen, within } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { CareerTimeline } from './career-timeline';

describe('<CareerTimeline />', () => {
  it('renders the career heading', () => {
    render(<CareerTimeline />, { locale: 'en' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Career');
  });

  it('renders one ordered step per role with company, role, period and bullets', () => {
    render(<CareerTimeline />, { locale: 'en' });

    const list = screen.getByRole('list', { name: 'Career timeline' });
    const steps = within(list)
      .getAllByRole('listitem')
      .filter((li) => li.parentElement === list);
    expect(steps).toHaveLength(career.length);
    career.forEach((role, index) => {
      expect(within(steps[index]).getByRole('heading', { level: 3 })).toHaveTextContent(
        role.company,
      );
    });
    expect(steps[0]).toHaveTextContent('Jan 2023 — Apr 2026');
  });

  it('marks the IT-to-engineering pivot once', () => {
    render(<CareerTimeline />, { locale: 'en' });

    expect(screen.getAllByText('Pivot: IT → Engineering')).toHaveLength(1);
  });

  it('renders in pt locale with correct heading text', () => {
    render(<CareerTimeline />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Carreira');

    expect(screen.getByRole('list', { name: 'Linha do tempo de carreira' })).toBeInTheDocument();
    expect(screen.getByText('Virada: TI → Engenharia')).toBeInTheDocument();
  });
});
