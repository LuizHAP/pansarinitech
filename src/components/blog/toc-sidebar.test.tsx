// Tests for TocSidebar — pure sync server component, no context dependencies.
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { TocSidebar } from './toc-sidebar';

const ENTRIES = [
  { id: 'intro', text: 'Introduction', level: 2 as const },
  { id: 'setup', text: 'Setup', level: 3 as const },
];

describe('<TocSidebar />', () => {
  it('returns null when entries array is empty', () => {
    const { container } = render(<TocSidebar entries={[]} label="On this page" />);
    expect(container.firstChild).toBeNull();
  });

  it('applies ml-4 class to level-3 entries and not to level-2 entries', () => {
    const { getAllByRole } = render(<TocSidebar entries={ENTRIES} label="On this page" />);
    // getAllByRole('listitem') returns all <li> elements
    const items = getAllByRole('listitem');
    const introItem = items.find((li) => li.textContent === 'Introduction');
    expect(introItem?.className).not.toContain('ml-4');
    const setupItem = items.find((li) => li.textContent === 'Setup');
    expect(setupItem?.className).toContain('ml-4');
  });

  it('renders a nav element with aria-labelledby="toc-heading"', () => {
    const { getByRole } = render(<TocSidebar entries={ENTRIES} label="On this page" />);
    const nav = getByRole('navigation');
    expect(nav.getAttribute('aria-labelledby')).toBe('toc-heading');
  });

  it('renders an h2 with id="toc-heading" whose text matches the label prop', () => {
    const { container } = render(<TocSidebar entries={ENTRIES} label="On this page" />);
    const heading = container.querySelector('#toc-heading');
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toBe('On this page');
  });

  it('renders anchors with correct href for each entry', () => {
    const { getAllByRole } = render(<TocSidebar entries={ENTRIES} label="On this page" />);
    const links = getAllByRole('link') as HTMLAnchorElement[];
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('#intro');
    expect(hrefs).toContain('#setup');
  });
});
