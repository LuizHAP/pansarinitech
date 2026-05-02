// src/app/apple-icon.tsx — Phase 4 D-26, SEO-06
//
// 180×180 Apple touch icon via Next 16 file convention. Saber-blue background
// with near-white 'LP' monogram + rounded corners — matches iOS home-screen
// expectations.
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0072d5',
        color: '#fbfbfd',
        fontSize: 100,
        fontWeight: 700,
        letterSpacing: '-0.04em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: 36,
      }}
    >
      LP
    </div>,
    { ...size },
  );
}
