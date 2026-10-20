import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Locale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo';
// src/lib/og.tsx — Phase 4 D-20..D-25 (single shared rendering factory)
//
// Used by 6 per-route opengraph-image.tsx files (added in Plan 04-02 + 04-03).
// Runtime: Node.js (default; explicit per CRITICAL CORRECTION #2). NOT Edge —
// readFile from node:fs/promises is the simplest path to bundle the committed
// font subset (no fetch + no SSRF surface; T-04-07).
//
// Font: src/app/fonts/bricolage-800.ttf (ASCII + Portuguese letters, ~27KB; ≤30KB budget).
// A glyph outside that subset renders blank, so widen the subset before using new scripts.
//
// Satori pitfalls baked in:
//   - Every wrapper sets display:'flex' (Pitfall §6 — Satori throws on
//     flex children without explicit display).
//   - CSS variables are NOT resolved at runtime; colours are hard-coded hex.
import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const ROLE_LINE: Record<Locale, string> = {
  en: '// principal software engineer · brazil → global',
  pt: '// principal software engineer · brasil → mundo',
};

// Derived from SITE_URL (src/lib/seo.ts) so the footer host always matches
// the live domain (no more hardcoded value to swap on custom-domain handover).
const SITE_URL_FOOTER = new URL(SITE_URL).host;

const INK = '#0e0f0c';
const PAPER = '#eeece6';
const SIGNAL = '#2f3bff';
const SIGNAL_SOFT = '#8f96ff';
const MUTED = '#9a9b92';
const RULE = '#26271f';

let cachedFont: ArrayBuffer | null = null;

async function loadDisplayFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const buf = await readFile(join(process.cwd(), 'src', 'app', 'fonts', 'bricolage-800.ttf'));
  // Copy into a fresh ArrayBuffer slice so Satori receives a plain ArrayBuffer
  // (Buffer is a Uint8Array but its .buffer may be larger than the bytes).
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  cachedFont = ab;
  return cachedFont;
}

export async function renderOgImage(opts: { title: string; locale: Locale }) {
  const fontData = await loadDisplayFont();
  const truncated = opts.title.length > 60 ? `${opts.title.slice(0, 57)}…` : opts.title;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: INK,
        padding: '56px 80px 0',
        fontFamily: 'Bricolage',
        color: PAPER,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 32 }}>
        <div style={{ display: 'flex', color: SIGNAL_SOFT }}>&gt;</div>
        <div style={{ display: 'flex' }}>pansarini</div>
        <div
          style={{ display: 'flex', marginLeft: 6, width: 15, height: 32, background: SIGNAL }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 84,
            lineHeight: 0.95,
            letterSpacing: '-0.045em',
            maxWidth: '92%',
          }}
        >
          {truncated}
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 26, color: MUTED }}>
          {ROLE_LINE[opts.locale]}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `2px solid ${RULE}`,
          padding: '24px 0',
          fontSize: 22,
          color: MUTED,
        }}
      >
        <div style={{ display: 'flex' }}>{SITE_URL_FOOTER}</div>
        <div style={{ display: 'flex', width: 120, height: 12, background: SIGNAL }} />
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [{ name: 'Bricolage', data: fontData, style: 'normal', weight: 800 }],
    },
  );
}
