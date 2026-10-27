import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { Font } from '@react-pdf/renderer';

export const colors = {
  ink: '#0E0F0C',
  paper: '#EEECE6',
  signal: '#2F3BFF',
  muted: '#5B5C57',
  line: '#D3D0C7',
  card: '#F7F6F2',
  coverMuted: '#9A9890',
  coverText: '#D9D7D0',
  coverRule: '#2B2C28',
  contactMuted: '#DADDFF',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'Bricolage Grotesque',
  mono: 'IBM Plex Mono',
} as const;

export function mm(value: number): number {
  return value * 2.835;
}

const FONT_FILES = {
  [fonts.display]: [
    ['bricolage-grotesque-latin-400-normal.woff', 400],
    ['bricolage-grotesque-latin-600-normal.woff', 600],
    ['bricolage-grotesque-latin-700-normal.woff', 700],
  ],
  [fonts.mono]: [
    ['ibm-plex-mono-latin-400-normal.woff', 400],
    ['ibm-plex-mono-latin-500-normal.woff', 500],
  ],
} as const;

let registered = false;

// fontkit reads a glyph header even for an empty glyph. When that glyph sits at the very end
// of a WOFF glyf table (IBM Plex Mono's space), the read overflows the decompressed table and
// throws; inside a plain SFNT file the same read stays in bounds.
export function woffToSfnt(woff: Buffer): Buffer {
  const numTables = woff.readUInt16BE(12);
  const tables = Array.from({ length: numTables }, (_, index) => {
    const entry = 44 + index * 20;
    const offset = woff.readUInt32BE(entry + 4);
    const compLength = woff.readUInt32BE(entry + 8);
    const origLength = woff.readUInt32BE(entry + 12);
    const raw = woff.subarray(offset, offset + compLength);
    return {
      tag: woff.subarray(entry, entry + 4),
      checksum: woff.readUInt32BE(entry + 16),
      data: compLength < origLength ? inflateSync(raw) : raw,
    };
  });
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** entrySelector * 16;
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(woff.readUInt32BE(4), 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(numTables * 16 - searchRange, 10);
  const chunks: Buffer[] = [header];
  let offset = header.length;
  tables.forEach((table, index) => {
    const record = 12 + index * 16;
    table.tag.copy(header, record);
    header.writeUInt32BE(table.checksum, record + 4);
    header.writeUInt32BE(offset, record + 8);
    header.writeUInt32BE(table.data.length, record + 12);
    const padded = Buffer.alloc(Math.ceil(table.data.length / 4) * 4);
    table.data.copy(padded);
    chunks.push(padded);
    offset += padded.length;
  });
  return Buffer.concat(chunks);
}

export function registerProposalFonts(): void {
  if (registered) return;
  const dir = join(process.cwd(), 'src', 'lib', 'proposals', 'fonts');
  for (const [family, files] of Object.entries(FONT_FILES)) {
    Font.register({
      family,
      fonts: files.map(([file, fontWeight]) => ({
        src: `data:font/ttf;base64,${woffToSfnt(readFileSync(join(dir, file))).toString('base64')}`,
        fontWeight,
      })),
    });
  }
  // The default hyphenation follows English rules and breaks Portuguese words in odd places.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
