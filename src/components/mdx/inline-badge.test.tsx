// Tests for InlineBadge sync RSC component — pure, no deps.
// Follows the same render(Component({...})) pattern as stat.test.tsx.
import React from 'react';
import { describe, expect, it } from 'vitest';

import { render } from '@testing-library/react';
import { InlineBadge } from './inline-badge';

describe('<InlineBadge />', () => {
  it('renders children text', () => {
    const { getByText } = render(InlineBadge({ children: 'hello' }));
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('default variant is primary — applies text-primary and border-primary classes', () => {
    const { container } = render(InlineBadge({ children: 'label' }));
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-primary');
    expect(span?.className).toContain('border-primary');
  });

  it('secondary variant applies bg-muted and text-muted-foreground', () => {
    const { container } = render(InlineBadge({ variant: 'secondary', children: 'label' }));
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-muted');
    expect(span?.className).toContain('text-muted-foreground');
  });

  it('muted variant applies text-muted-foreground and border-border', () => {
    const { container } = render(InlineBadge({ variant: 'muted', children: 'label' }));
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-muted-foreground');
    expect(span?.className).toContain('border-border');
  });

  it('destructive variant applies text-destructive and border-destructive', () => {
    const { container } = render(InlineBadge({ variant: 'destructive', children: 'label' }));
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-destructive');
    expect(span?.className).toContain('border-destructive');
  });

  it('renders a span element (not a div)', () => {
    const { container } = render(InlineBadge({ children: 'label' }));
    expect(container.querySelector('span')).not.toBeNull();
    expect(container.querySelector('div')).toBeNull();
  });
});
