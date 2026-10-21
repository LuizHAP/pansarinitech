// Tests for PostCard — async RSC. All async dependencies are mocked.
// vi.mock() calls hoisted to top to satisfy vitest mock hoisting.
import React from 'react';

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi
    .fn()
    .mockResolvedValue((key: string, params?: Record<string, unknown>) =>
      key === 'readingTime' && params ? `${params.minutes} min read` : key,
    ),
}));

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

vi.mock('@/lib/i18n/helpers', () => ({
  formatDate: () => 'Jan 1, 2025',
}));

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PostCard } from './post-card';

const POST_WITH_TAGS = {
  slug: 'test-post',
  title: 'Test Post',
  date: '2025-01-01',
  excerpt: 'An excerpt.',
  tags: ['typescript', 'react'],
  readingTime: { minutes: 3 },
};

const POST_NO_TAGS = { ...POST_WITH_TAGS, tags: [] };

describe('<PostCard />', () => {
  it('renders a list with one badge per tag when tags are present', async () => {
    const jsx = await PostCard({ post: POST_WITH_TAGS, locale: 'en' });
    const { getAllByRole, getByRole } = render(jsx);
    expect(getByRole('list')).toBeInTheDocument();
    expect(getAllByRole('listitem')).toHaveLength(2);
  });

  it('does not render a list when tags array is empty', async () => {
    const jsx = await PostCard({ post: POST_NO_TAGS, locale: 'en' });
    const { queryByRole } = render(jsx);
    expect(queryByRole('list')).toBeNull();
  });

  it('renders time element with dateTime attribute matching post.date', async () => {
    const jsx = await PostCard({ post: POST_WITH_TAGS, locale: 'en' });
    const { container } = render(jsx);
    const timeEl = container.querySelector('time');
    expect(timeEl?.getAttribute('dateTime')).toBe('2025-01-01');
  });

  it('renders the reading time next to the date', async () => {
    const jsx = await PostCard({ post: POST_WITH_TAGS, locale: 'en' });
    const { container } = render(jsx);
    const paragraph = container.querySelector('time')?.parentElement;
    expect(paragraph?.textContent).toBe('Jan 1, 2025 · 3 min read');
  });

  it('renders the title as an h2 link to the localized post route', async () => {
    const jsx = await PostCard({ post: POST_WITH_TAGS, locale: 'en' });
    const { getByRole } = render(jsx);
    const heading = getByRole('heading', { level: 2, name: 'Test Post' });
    expect(heading.querySelector('a')).toHaveAttribute('href', '/blog/test-post');
  });

  it('renders each tag as a hash label', async () => {
    const jsx = await PostCard({ post: POST_WITH_TAGS, locale: 'en' });
    const { getAllByRole } = render(jsx);
    expect(getAllByRole('listitem').map((li) => li.textContent)).toEqual(['#typescript', '#react']);
  });
});
