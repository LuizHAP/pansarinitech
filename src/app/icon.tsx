// src/app/icon.tsx — Phase 4 D-26, SEO-06
//
// 32×32 favicon via Next 16 file convention. Saber-blue 'LP' monogram on
// near-white background; single icon variant (browsers don't reliably honor
// light/dark favicon swaps).
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fbfbfd',
        color: '#0072d5',
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.05em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      LP
    </div>,
    { ...size },
  );
}
