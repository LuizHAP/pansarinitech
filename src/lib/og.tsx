import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Locale } from '@/i18n/routing';
// src/lib/og.tsx — Phase 4 D-20..D-25 (single shared rendering factory)
//
// Used by 6 per-route opengraph-image.tsx files (added in Plan 04-02 + 04-03).
// Runtime: Node.js (default; explicit per CRITICAL CORRECTION #2). NOT Edge —
// readFile from node:fs/promises is the simplest path to bundle the committed
// Geist Bold subset (no fetch + no SSRF surface; T-04-07).
//
// Font: src/app/fonts/geist-bold.ttf (ASCII Latin-1 subset, ~26KB; ≤30KB budget).
// Palette: Sith-locked (D-21) — saber red on near-black across BOTH locales.
//
// Satori pitfalls baked in:
//   - Every wrapper sets display:'flex' (Pitfall §6 — Satori throws on
//     flex children without explicit display).
//   - OKLCH CSS vars are NOT resolved at runtime; we hard-code hex equivalents
//     of the Sith palette tokens.
import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const ROLE_LINE: Record<Locale, string> = {
  en: 'Principal Software Engineer · Brazil',
  pt: 'Principal Software Engineer · Brasil',
};

// D-25 TODO: swap to pansarini.tech in Phase 5 (custom domain handover).
const SITE_URL_FOOTER = 'pansarinitech.vercel.app';

// OKLCH palette → hex equivalents. Satori does NOT resolve CSS variables at
// runtime, so per-token hex is required. Values mirror :root.dark in
// src/app/globals.css (Sith palette).
const SABER_RED = '#cd1819';
const NEAR_BLACK = '#0c0c12';
const TEXT_WHITE = '#eef0f3';
const MUTED = '#898b91';

let cachedFont: ArrayBuffer | null = null;

async function loadGeistBold(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const buf = await readFile(join(process.cwd(), 'src', 'app', 'fonts', 'geist-bold.ttf'));
  // Copy into a fresh ArrayBuffer slice so Satori receives a plain ArrayBuffer
  // (Buffer is a Uint8Array but its .buffer may be larger than the bytes).
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  cachedFont = ab;
  return cachedFont;
}

export async function renderOgImage(opts: { title: string; locale: Locale }) {
  const fontData = await loadGeistBold();
  const truncated = opts.title.length > 60 ? `${opts.title.slice(0, 57)}…` : opts.title;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: NEAR_BLACK,
        backgroundImage: `radial-gradient(ellipse at 100% 100%, ${SABER_RED}33 0%, ${NEAR_BLACK} 60%)`,
        padding: '64px 80px',
        fontFamily: 'GeistBold',
        color: TEXT_WHITE,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: '85%',
            display: 'flex',
          }}
        >
          {truncated}
        </div>
        <div
          style={{ marginTop: 16, width: 96, height: 2, background: SABER_RED, display: 'flex' }}
        />
        <div
          style={{
            marginTop: 24,
            fontSize: 24,
            fontWeight: 500,
            color: MUTED,
            display: 'flex',
          }}
        >
          {ROLE_LINE[opts.locale]}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 18,
          color: MUTED,
        }}
      >
        <div style={{ display: 'flex' }}>{SITE_URL_FOOTER}</div>
        <div style={{ color: SABER_RED, fontSize: 28, display: 'flex' }}>●</div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [{ name: 'GeistBold', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}
