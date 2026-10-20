import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Marquee } from './marquee';

const WORDS = ['TypeScript', 'React', 'Next.js'];

describe('<Marquee />', () => {
  it('exposes the word list once to assistive tech under its label', () => {
    const { container } = render(<Marquee words={WORDS} label="Technologies I work with" />);

    const list = screen.getByRole('list', { name: 'Technologies I work with' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(WORDS);
    expect(screen.getAllByRole('list')).toHaveLength(1);

    const lists = container.querySelectorAll('ul');
    expect(lists).toHaveLength(2);
    expect(lists[1]).toHaveAttribute('aria-hidden', 'true');
    expect(lists[1].textContent).toBe(lists[0].textContent);
  });
});
