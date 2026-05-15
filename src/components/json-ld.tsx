// src/components/json-ld.tsx — Phase 4 SEO-02
//
// Shared RSC that serializes any schema object into a
// <script type="application/ld+json"> tag. No "use client" — server-only.
// Next.js App Router hoists these script tags to <head> at build time.
//
// Usage:
//   import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld'
//   <JsonLd schema={{ "@context": "https://schema.org", "@type": "Article", ... }} />

export { SITE_URL } from '@/lib/seo';

/** Single-author Person object reused in both author and publisher fields. */
export const AUTHOR_PERSON = {
  '@type': 'Person',
  name: 'Luiz Pansarini',
} as const;

interface JsonLdProps {
  schema: Record<string, unknown>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script tags require dangerouslySetInnerHTML; content comes from Zod-validated frontmatter (site owner only — no user input)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
