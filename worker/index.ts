import * as campaigns from './campaigns';
import { createContext } from './context';
import * as scraper from './scraper';
import * as whatsapp from './whatsapp';

async function main() {
  const ctx = createContext();
  ctx.log.info('worker iniciado');
  await Promise.all([whatsapp.start(ctx), scraper.start(ctx), campaigns.start(ctx)]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
