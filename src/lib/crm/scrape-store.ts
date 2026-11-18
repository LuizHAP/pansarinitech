import { randomUUID } from 'node:crypto';
import { getLeadsRedis } from '@/lib/admin/lead-store';
import { SCRAPE_KEYS, type ScrapeJob } from '@/lib/crm/contract';
import type { ScrapeRequest } from '@/lib/crm/scrape';

export const SCRAPE_HEARTBEAT_KEY = 'scrape:heartbeat';
export const SCRAPE_HEARTBEAT_MAX_AGE_MS = 20_000;
export const SCRAPE_JOBS_LIMIT = 30;

export type ScrapeOverview = {
  available: boolean;
  workerOnline: boolean;
  jobs: ScrapeJob[];
};

export function isWorkerOnline(heartbeat: number | null, now = Date.now()): boolean {
  return heartbeat !== null && now - heartbeat <= SCRAPE_HEARTBEAT_MAX_AGE_MS;
}

export async function readScrapeOverview(): Promise<ScrapeOverview> {
  const redis = getLeadsRedis();
  if (!redis) return { available: false, workerOnline: false, jobs: [] };
  try {
    const [ids, heartbeat] = await Promise.all([
      redis.zrange<string[]>(SCRAPE_KEYS.jobs, 0, SCRAPE_JOBS_LIMIT - 1, { rev: true }),
      redis.get<number>(SCRAPE_HEARTBEAT_KEY),
    ]);
    const records =
      ids.length > 0 ? await redis.mget<(ScrapeJob | null)[]>(...ids.map(SCRAPE_KEYS.job)) : [];
    return {
      available: true,
      workerOnline: isWorkerOnline(heartbeat === null ? null : Number(heartbeat)),
      jobs: records.filter((job): job is ScrapeJob => job !== null),
    };
  } catch {
    return { available: false, workerOnline: false, jobs: [] };
  }
}

export async function enqueueScrapeJob(request: ScrapeRequest): Promise<ScrapeJob> {
  const redis = getLeadsRedis();
  if (!redis) throw new Error('Redis indisponível');
  const now = Date.now();
  const job: ScrapeJob = {
    id: randomUUID(),
    query: request.query,
    city: request.city,
    state: request.state,
    maxResults: request.maxResults,
    status: 'queued',
    found: 0,
    added: 0,
    duplicates: 0,
    error: null,
    createdAt: now,
    startedAt: null,
    finishedAt: null,
  };
  const transaction = redis.multi();
  transaction.set(SCRAPE_KEYS.job(job.id), job);
  transaction.zadd(SCRAPE_KEYS.jobs, { score: now, member: job.id });
  transaction.lpush(SCRAPE_KEYS.queue, job.id);
  await transaction.exec();
  return job;
}

export async function cancelScrapeJob(id: string): Promise<boolean> {
  const redis = getLeadsRedis();
  if (!redis) throw new Error('Redis indisponível');
  const job = await redis.get<ScrapeJob>(SCRAPE_KEYS.job(id));
  if (!job || (job.status !== 'queued' && job.status !== 'running')) return false;
  await redis.lrem(SCRAPE_KEYS.queue, 0, id);
  await redis.set(SCRAPE_KEYS.job(id), {
    ...job,
    status: 'cancelled',
    finishedAt: Date.now(),
  } satisfies ScrapeJob);
  return true;
}
