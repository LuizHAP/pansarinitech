// Tests for TocMobile — pure sync server component, no context dependencies.
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { TocMobile } from './toc-mobile';

const ENTRIES = [
  { id: 'intro', text: 'Introduction', level: 2 as const },
  { id: 'setup', text: 'Setup', level: 3 as const },
];

describe('<TocMobile />', () => {
  it('returns null when entries array is empty', () => {
    const { container } = render(<TocMobile entries={[]} label="Contents" />);
    expect(container.firstChild).toBeNull();
  });

  it('applies ml-4 class to level-3 entries and not to level-2 entries', () => {
    const { getAllByRole } = render(<TocMobile entries={ENTRIES} label="Contents" />);
    const items = getAllByRole('listitem');
    // 'Introduction' is level 2 — no ml-4
    const introItem = items.find((li) => li.textContent === 'Introduction');
    expect(introItem?.className).not.toContain('ml-4');
    // 'Setup' is level 3 — has ml-4
    const setupItem = items.find((li) => li.textContent === 'Setup');
    expect(setupItem?.className).toContain('ml-4');
  });

  it('renders anchors with correct href for each entry', () => {
    const { getAllByRole } = render(<TocMobile entries={ENTRIES} label="Contents" />);
    const links = getAllByRole('link') as HTMLAnchorElement[];
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('#intro');
    expect(hrefs).toContain('#setup');
  });

  it('renders the label prop inside the summary element', () => {
    const { getByText } = render(<TocMobile entries={ENTRIES} label="Contents" />);
    expect(getByText('Contents')).toBeInTheDocument();
  });
});
