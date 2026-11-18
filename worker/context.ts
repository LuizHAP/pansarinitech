import { getLeadsRedis } from '@/lib/admin/lead-store';
import type { Redis } from '@upstash/redis';
import pino from 'pino';

export type WorkerContext = { redis: Redis; log: pino.Logger };

export function createContext(): WorkerContext {
  const redis = getLeadsRedis();
  if (!redis) throw new Error('KV_REST_API_URL/KV_REST_API_TOKEN ausentes (.env.local)');
  return { redis, log: pino({ level: process.env.LOG_LEVEL ?? 'info' }) };
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
