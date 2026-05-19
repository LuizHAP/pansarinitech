// Tests for json-ld.tsx — Phase 5 TEST-02
//
// JsonLd is a pure-logic RSC that serializes schema objects into a
// <script type="application/ld+json"> tag. Tests use raw @testing-library/react
// (NOT @/test/render) because no locale context or theme provider is needed.
// Coverage target: PURE_100 (100/100/100/100).
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JsonLd, { AUTHOR_PERSON, SITE_URL } from './json-ld';

describe('<JsonLd />', () => {
  it('renders a script tag with type application/ld+json and correct innerHTML', () => {
    const schema = { '@type': 'Article', name: 'Test' };
    const { container } = render(<JsonLd schema={schema} />);

    const scriptEl = container.querySelector('script[type="application/ld+json"]');
    expect(scriptEl).not.toBeNull();
    expect(scriptEl?.innerHTML).toBe(JSON.stringify(schema));
  });

  it('escapes < characters in schema values to \\u003c (XSS boundary)', () => {
    const schema = { title: '<script>alert(1)</script>' };
    const { container } = render(<JsonLd schema={schema} />);

    const scriptEl = container.querySelector('script[type="application/ld+json"]');
    expect(scriptEl).not.toBeNull();
    // Must NOT contain a raw less-than character (XSS vector)
    expect(scriptEl?.innerHTML).not.toContain('<');
    // Must contain the unicode escape sequence
    expect(scriptEl?.innerHTML).toContain('\\u003c');
  });
});

describe('AUTHOR_PERSON export', () => {
  it('has @type === "Person" and name === "Luiz Pansarini"', () => {
    expect(AUTHOR_PERSON['@type']).toBe('Person');
    expect(AUTHOR_PERSON.name).toBe('Luiz Pansarini');
  });
});

describe('SITE_URL export', () => {
  it('is a non-empty string', () => {
    expect(typeof SITE_URL).toBe('string');
    expect(SITE_URL.length).toBeGreaterThan(0);
  });
});
