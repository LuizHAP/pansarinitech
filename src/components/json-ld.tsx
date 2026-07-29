// src/components/json-ld.tsx — Phase 4 SEO-02
//
// Shared RSC that serializes any schema object into a
// <script type="application/ld+json"> tag. No "use client" — server-only.
// Next.js App Router hoists these script tags to <head> at build time.
//
// Usage:
//   import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld'
//   <JsonLd schema={{ "@context": "https://schema.org", "@type": "Article", ... }} />

import { SITE_URL } from '@/lib/seo';
export { SITE_URL };

/** Single-author Person object reused in both author and publisher fields. */
export const AUTHOR_PERSON = {
  '@id': `${SITE_URL}/#person`,
  '@type': 'Person',
  name: 'Luiz Pansarini',
  url: SITE_URL,
  jobTitle: 'Principal Software Engineer',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Jundiaí',
    addressRegion: 'SP',
    addressCountry: 'BR',
  },
  sameAs: ['https://github.com/LuizHAP', 'https://linkedin.com/in/luizpansarini'],
} as const;

interface JsonLdProps {
  schema: Record<string, unknown>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script tags require dangerouslySetInnerHTML; content comes from Zod-validated frontmatter (site owner only — no user input)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}
