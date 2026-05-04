// Tests for ThemeProvider wrapper component.
// Uses raw @testing-library/react (NOT @/test/render) because @/test/render
// already wraps with a ThemeProvider — using it here would mask whether THIS
// component renders one, and would cause double-nesting.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './theme-provider';

describe('<ThemeProvider />', () => {
  it('renders its children to the DOM', () => {
    render(
      <ThemeProvider attribute="class">
        <span data-testid="child">hi</span>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('hi');
  });

  it('applies dark class to documentElement when defaultTheme="dark" and enableSystem={false}', () => {
    // next-themes applies the class synchronously on mount when enableSystem is false.
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <span data-testid="child">content</span>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
