// src/components/shared/easter-egg.tsx — Phase 4 D-33, EASTER-02
//
// Production-only console.log easter egg with ASCII saber + saber-red %c
// color. Renders nothing in dev (returns null when NODE_ENV !== 'production'),
// so the dev console stays clean. Inline <Script id="easter-egg"> is deduped
// by Next 16's script registry — fires exactly once on first page load.
//
// CSP NOTE: this is currently `unsafe-inline`. Phase 5 CSP work will need to
// either allowlist this script's hash OR move the payload to a static .js file
// in /public.
import Script from 'next/script';

const EASTER_EGG_LINES = [
  '═══════════════════════════════════════',
  ' Hello, fellow developer.',
  ' May the Force be with your code.',
  '═══════════════════════════════════════',
  '',
  '   ▌',
  '   ▌',
  '   ▌',
  '   ▌',
  '   ▌',
  '   █  ← saber',
  '',
  ' Source: github.com/LuizHAP/pansarinitech',
];

export function EasterEgg() {
  if (process.env.NODE_ENV !== 'production') return null;

  // JSON.stringify so any future special-char in the lines is escaped safely
  // when interpolated into the inline script payload.
  const message = JSON.stringify(EASTER_EGG_LINES.join('\n'));

  // %c saber-red color matches Sith --primary. %s carries the message as a
  // single token so line breaks render correctly in the browser console.
  const inlineScript = `console.log("%c%s", "color: #cd1819; font-family: monospace; font-size: 12px;", ${message});`;

  return (
    <Script id="easter-egg" strategy="afterInteractive">
      {inlineScript}
    </Script>
  );
}
