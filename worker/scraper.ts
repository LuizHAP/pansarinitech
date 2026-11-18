import { randomUUID } from 'node:crypto';
import { insertLead, listLeads } from '@/lib/admin/lead-store';
import type { Lead } from '@/lib/admin/leads';
import { SCRAPE_KEYS, type ScrapeJob } from '@/lib/crm/contract';
import {
  type RawPlace,
  type ScrapedPlace,
  buildSearchQuery,
  clampMaxResults,
  dedupeKeys,
  leadDedupeKeys,
  parsePlace,
  searchUrl,
  toLeadInput,
} from '@/lib/crm/scrape';
import { SCRAPE_HEARTBEAT_KEY } from '@/lib/crm/scrape-store';
import { type Browser, type Page, chromium } from 'playwright';
import { type WorkerContext, sleep } from './context';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FEED = 'div[role="feed"]';
const PLACE_LINK = `${FEED} a[href*="/maps/place/"]`;
const IDLE_POLL_MS = 3000;
const HEARTBEAT_MS = 5000;

const EXTRACT_SCRIPT = `(() => {
  const q = (s) => document.querySelector(s);
  const main = q('div[role="main"]') || document.body;
  const phoneEl = q('button[data-item-id^="phone:tel:"]') || q('[data-item-id^="phone:tel:"]');
  const phoneId = phoneEl ? phoneEl.getAttribute('data-item-id') || '' : '';
  const phoneText = phoneEl ? (phoneEl.querySelector('.fontBodyMedium') || phoneEl).textContent : '';
  const addrEl = q('[data-item-id="address"] .fontBodyMedium') || q('[data-item-id*="address"] .fontBodyMedium') || q('[data-item-id*="address"]');
  const siteEl = q('a[data-item-id="authority"]');
  const ratingEl = q('div.F7nice span[aria-hidden="true"]');
  const reviewEl = Array.from(document.querySelectorAll('div.F7nice span[aria-label]')).find((el) => /avalia|review/i.test(el.getAttribute('aria-label') || ''));
  const f7 = q('div.F7nice');
  const parens = f7 ? (f7.textContent || '').match(/\\(([\\d.,]+)\\)/) : null;
  return {
    name: (q('h1.DUwDvf') || q('h1') || {}).textContent || '',
    category: (q('button[jsaction*="category"]') || {}).textContent || '',
    address: addrEl ? addrEl.textContent || '' : '',
    phone: phoneId.replace('phone:tel:', '') || phoneText || '',
    websiteHref: siteEl ? siteEl.href : '',
    hrefs: Array.from(main.querySelectorAll('a[href^="http"]')).map((a) => a.href),
    ratingText: ratingEl ? ratingEl.textContent || '' : '',
    reviewsText: reviewEl ? reviewEl.getAttribute('aria-label') || '' : parens ? parens[1] : '',
    url: location.href,
  };
})()`;

const randomBetween = (min: number, max: number) => min + Math.floor(Math.random() * (max - min));
const pause = (min: number, max: number) => sleep(randomBetween(min, max));

export async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: process.env.SCRAPER_HEADED !== '1' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/executable doesn't exist|playwright install/i.test(message)) {
      throw new Error(
        'Chromium do Playwright não está instalado. Rode: pnpm exec playwright install chromium',
      );
    }
    throw error;
  }
}

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1366, height: 900 },
  });
  return context.newPage();
}

async function acceptConsent(page: Page): Promise<void> {
  const button = page
    .getByRole('button', { name: /^(Aceitar tudo|Rejeitar tudo|Accept all|Reject all)$/i })
    .first();
  try {
    if (await button.isVisible({ timeout: 4000 })) {
      await button.click();
      await page.waitForLoadState('domcontentloaded');
      await pause(800, 1500);
    }
  } catch {}
}

export async function extractRawPlace(page: Page): Promise<RawPlace> {
  return (await page.evaluate(EXTRACT_SCRIPT)) as RawPlace;
}

export async function collectPlaceLinks(
  page: Page,
  limit: number,
  shouldStop: () => Promise<boolean>,
): Promise<string[]> {
  try {
    await page.waitForSelector(FEED, { timeout: 15000 });
  } catch {
    return [];
  }
  let previous = 0;
  let stuck = 0;
  while (stuck < 4) {
    if (await shouldStop()) break;
    const count = await page.locator(PLACE_LINK).count();
    if (count >= limit) break;
    stuck = count === previous ? stuck + 1 : 0;
    previous = count;
    await page.evaluate(
      `(() => { const f = document.querySelector('div[role="feed"]'); if (f) f.scrollTop = f.scrollHeight; })()`,
    );
    await pause(1200, 2200);
    const ended = await page
      .getByText(/chegou ao final da lista|reached the end of the list/i)
      .first()
      .isVisible()
      .catch(() => false);
    if (ended) break;
  }
  const hrefs = await page
    .locator(PLACE_LINK)
    .evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
  return [...new Set(hrefs)].slice(0, limit);
}

async function readPlace(page: Page, href: string): Promise<ScrapedPlace | null> {
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try {
    await page.waitForSelector('h1', { timeout: 10000 });
  } catch {
    return null;
  }
  await pause(900, 1600);
  return parsePlace(await extractRawPlace(page));
}

async function patchJob(
  ctx: WorkerContext,
  id: string,
  patch: Partial<ScrapeJob>,
): Promise<ScrapeJob | null> {
  const current = await ctx.redis.get<ScrapeJob>(SCRAPE_KEYS.job(id));
  if (!current) return null;
  const next: ScrapeJob =
    current.status === 'cancelled'
      ? { ...current, ...patch, status: 'cancelled' }
      : { ...current, ...patch };
  await ctx.redis.set(SCRAPE_KEYS.job(id), next);
  return next;
}

async function isCancelled(ctx: WorkerContext, id: string): Promise<boolean> {
  const job = await ctx.redis.get<ScrapeJob>(SCRAPE_KEYS.job(id));
  return job?.status === 'cancelled';
}

function newLead(place: ScrapedPlace, job: ScrapeJob): Lead {
  const { input, extras } = toLeadInput(place, job);
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    ...input,
    extras,
    stage: 'prospectado',
    history: [{ stage: 'prospectado', at: now }],
    createdAt: now,
    updatedAt: now,
  };
}

async function runJob(ctx: WorkerContext, job: ScrapeJob): Promise<void> {
  const maxResults = clampMaxResults(job.maxResults);
  const { available, leads } = await listLeads();
  if (!available) throw new Error('Não foi possível ler os leads existentes (Redis indisponível).');
  const seen = new Set(leads.flatMap(leadDedupeKeys));

  let found = 0;
  let added = 0;
  let duplicates = 0;
  const browser = await launchBrowser();
  try {
    const listPage = await newPage(browser);
    const detailPage = await newPage(browser);
    await listPage.goto(searchUrl(buildSearchQuery(job.query, job.city, job.state)), {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await acceptConsent(listPage);

    const hrefs = await collectPlaceLinks(listPage, maxResults, () => isCancelled(ctx, job.id));
    ctx.log.info({ job: job.id, links: hrefs.length }, 'scraper: resultados listados');

    for (const href of hrefs) {
      if (await isCancelled(ctx, job.id)) return;
      let place: ScrapedPlace | null = null;
      try {
        place = await readPlace(detailPage, href);
      } catch (error) {
        ctx.log.warn({ job: job.id, err: String(error) }, 'scraper: falha ao abrir resultado');
      }
      if (place) {
        found += 1;
        const keys = dedupeKeys(place);
        if (keys.some((key) => seen.has(key))) {
          duplicates += 1;
        } else {
          try {
            await insertLead(newLead(place, job));
            for (const key of keys) seen.add(key);
            added += 1;
          } catch (error) {
            ctx.log.error({ job: job.id, err: String(error) }, 'scraper: falha ao inserir lead');
          }
        }
        const updated = await patchJob(ctx, job.id, { found, added, duplicates });
        if (updated?.status === 'cancelled') return;
      }
      await pause(1500, 3500);
    }
  } finally {
    await browser.close().catch(() => {});
    await patchJob(ctx, job.id, { found, added, duplicates });
  }
}

async function processJob(ctx: WorkerContext, id: string): Promise<void> {
  const job = await ctx.redis.get<ScrapeJob>(SCRAPE_KEYS.job(id));
  if (!job || job.status !== 'queued') return;
  const running = await patchJob(ctx, id, {
    status: 'running',
    startedAt: Date.now(),
    error: null,
  });
  if (!running) return;
  ctx.log.info({ job: id, query: job.query, city: job.city }, 'scraper: job iniciado');
  try {
    await runJob(ctx, running);
    const after = await ctx.redis.get<ScrapeJob>(SCRAPE_KEYS.job(id));
    if (after?.status === 'cancelled') {
      await patchJob(ctx, id, { finishedAt: after.finishedAt ?? Date.now() });
    } else {
      await patchJob(ctx, id, { status: 'done', finishedAt: Date.now() });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.log.error({ job: id, err: message }, 'scraper: job falhou');
    await patchJob(ctx, id, {
      status: 'failed',
      error: message.slice(0, 500),
      finishedAt: Date.now(),
    });
  }
}

async function failStaleJobs(ctx: WorkerContext): Promise<void> {
  const ids = await ctx.redis.zrange<string[]>(SCRAPE_KEYS.jobs, 0, 49, { rev: true });
  for (const id of ids) {
    const job = await ctx.redis.get<ScrapeJob>(SCRAPE_KEYS.job(id));
    if (job?.status === 'running') {
      await patchJob(ctx, id, {
        status: 'failed',
        error: 'O worker foi reiniciado durante a execução.',
        finishedAt: Date.now(),
      });
    }
  }
}

export async function start(ctx: WorkerContext): Promise<void> {
  const beat = () =>
    ctx.redis.set(SCRAPE_HEARTBEAT_KEY, Date.now(), { ex: 60 }).catch((error: unknown) => {
      ctx.log.warn({ err: String(error) }, 'scraper: heartbeat falhou');
    });
  await beat();
  setInterval(beat, HEARTBEAT_MS).unref();

  await failStaleJobs(ctx).catch((error: unknown) => {
    ctx.log.warn({ err: String(error) }, 'scraper: não foi possível limpar jobs antigos');
  });

  for (;;) {
    try {
      const id = await ctx.redis.rpop<string>(SCRAPE_KEYS.queue);
      if (id) {
        await processJob(ctx, String(id));
        continue;
      }
    } catch (error) {
      ctx.log.error({ err: String(error) }, 'scraper: erro no loop');
    }
    await sleep(IDLE_POLL_MS);
  }
}
