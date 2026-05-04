import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { Skills } from './skills';

describe('<Skills />', () => {
  it('renders the section heading and filter chip "All" in en locale', () => {
    render(<Skills />, { locale: 'en' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Stack & Skills');

    // "All" chip is the default active filter
    const allBtn = screen.getByRole('button', { name: /^All$/ });
    expect(allBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders "Todos" filter chip in pt locale', () => {
    render(<Skills />, { locale: 'pt' });

    const todosBtn = screen.getByRole('button', { name: /^Todos$/ });
    expect(todosBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a category chip updates aria-pressed to true', async () => {
    render(<Skills />, { locale: 'en' });
    const user = userEvent.setup();

    const frontendBtn = screen.getByRole('button', { name: /^Frontend$/ });
    expect(frontendBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(frontendBtn);

    expect(screen.getByRole('button', { name: /^Frontend$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // All chip should no longer be active
    expect(screen.getByRole('button', { name: /^All$/ })).toHaveAttribute('aria-pressed', 'false');
  });
});
