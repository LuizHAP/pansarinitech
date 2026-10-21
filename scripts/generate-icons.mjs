import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// sharp is not a direct dependency; next ships it, so borrow next's copy instead of adding one.
const nextDir = dirname(require.resolve('next/package.json'));
const sharp = require(require.resolve('sharp', { paths: [nextDir] }));

const source = readFileSync(join(root, 'public/icon.svg'));

// The 512-unit viewBox rasterises at 512px at 72 dpi, so every target is a downscale.
async function render(size) {
  return sharp(source, { density: 72 })
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

function buildIco(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

const sizes = [16, 32, 48, 180, 512];
const renders = Object.fromEntries(
  await Promise.all(sizes.map(async (size) => [size, await render(size)])),
);

const outputs = {
  'src/app/icon.png': renders[32],
  'src/app/apple-icon.png': renders[180],
  'public/favicon-16x16.png': renders[16],
  'public/favicon-32x32.png': renders[32],
  'public/apple-touch-icon.png': renders[180],
  'public/pansarini-mark.png': renders[512],
};

const ico = buildIco([16, 32, 48].map((size) => ({ size, png: renders[size] })));
outputs['src/app/favicon.ico'] = ico;
outputs['public/favicon.ico'] = ico;

for (const [path, buffer] of Object.entries(outputs)) {
  writeFileSync(join(root, path), buffer);
}
console.log(`[generate-icons] Wrote ${Object.keys(outputs).length} files from public/icon.svg`);

const previewFlag = process.argv.indexOf('--preview');
if (previewFlag !== -1) {
  const dir = process.argv[previewFlag + 1];
  if (!dir) throw new Error('--preview needs a directory');
  mkdirSync(dir, { recursive: true });
  for (const size of [16, 32, 180, 512]) {
    writeFileSync(join(dir, `icon-${size}.png`), renders[size]);
  }
  for (const size of [16, 32]) {
    const upscaled = await sharp(renders[size])
      .resize(size * 8, size * 8, { kernel: 'nearest' })
      .png()
      .toBuffer();
    writeFileSync(join(dir, `icon-${size}@8x.png`), upscaled);
  }
  console.log(`[generate-icons] Previews in ${dir}`);
}
