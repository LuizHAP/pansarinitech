// Tests for Stat RSC component — pure sync, no deps.
// Renders a number + label pair in specific span classes.
import React from 'react';
import { describe, expect, it } from 'vitest';

import { render } from '@testing-library/react';
import { Stat } from './stat';

describe('<Stat />', () => {
  it('renders number span with text-4xl and label span with text-muted-foreground', () => {
    const { container } = render(Stat({ number: '47', label: 'engineers onboarded' }));
    const numberSpan = container.querySelector('.text-4xl');
    const labelSpan = container.querySelector('.text-muted-foreground');
    expect(numberSpan).toBeInTheDocument();
    expect(numberSpan?.textContent).toBe('47');
    expect(labelSpan).toBeInTheDocument();
    expect(labelSpan?.textContent).toBe('engineers onboarded');
  });
});
