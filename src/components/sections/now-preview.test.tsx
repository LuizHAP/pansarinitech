import { now } from '@/data/now';
import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { NowPreview } from './now-preview';

describe('<NowPreview />', () => {
  it('renders the H2 heading with correct id in en locale', () => {
    render(<NowPreview />, { locale: 'en' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'now-preview-heading');
    expect(heading).toHaveTextContent("What I'm doing now");
  });

  it('renders a <time> element with the lastUpdated dateTime value', () => {
    render(<NowPreview />, { locale: 'en' });

    const timeEl = screen.getByText((_, element) => element?.tagName === 'TIME');
    expect(timeEl).toHaveAttribute('dateTime', now.lastUpdated);
  });

  it('renders the three now topics as headed items', () => {
    render(<NowPreview />, { locale: 'en' });

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Working on', 'Reading / Learning', 'Side / Personal']);
    expect(screen.getByText(/Building this portfolio in my spare time/)).toBeInTheDocument();
  });

  it('renders the /now page link', () => {
    render(<NowPreview />, { locale: 'en' });

    const link = screen.getByRole('link', { name: /See more on the \/now page/i });
    expect(link).toHaveAttribute('href', '/en/now');
  });

  it('renders the pt locale heading', () => {
    render(<NowPreview />, { locale: 'pt' });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('O que estou fazendo agora');
  });
});
