import type { Lead } from '@/lib/admin/leads';
import { Redis } from '@upstash/redis';

const KEY_PREFIX = 'leads';

export const LEADS_INDEX_KEY = `${KEY_PREFIX}:index`;

export function leadKey(id: string): string {
  return `${KEY_PREFIX}:lead:${id}`;
}

export function getLeadsRedis(env: NodeJS.ProcessEnv = process.env): Redis | null {
  const url = env.KV_REST_API_URL;
  const token = env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function requireRedis(): Redis {
  const redis = getLeadsRedis();
  if (!redis) throw new Error('Redis indisponível');
  return redis;
}

export async function listLeads(): Promise<{ available: boolean; leads: Lead[] }> {
  // Missing or rejected credentials (CI, local) have to read as unavailable, not a 500.
  const redis = getLeadsRedis();
  if (!redis) return { available: false, leads: [] };
  try {
    const ids = await redis.zrange<string[]>(LEADS_INDEX_KEY, 0, -1);
    if (ids.length === 0) return { available: true, leads: [] };
    const records = await redis.mget<(Lead | null)[]>(...ids.map(leadKey));
    return { available: true, leads: records.filter((lead): lead is Lead => lead !== null) };
  } catch {
    return { available: false, leads: [] };
  }
}

export async function findLead(id: string): Promise<{ available: boolean; lead: Lead | null }> {
  const redis = getLeadsRedis();
  if (!redis) return { available: false, lead: null };
  try {
    return { available: true, lead: await redis.get<Lead>(leadKey(id)) };
  } catch {
    return { available: false, lead: null };
  }
}

export async function insertLead(lead: Lead): Promise<void> {
  const transaction = requireRedis().multi();
  transaction.set(leadKey(lead.id), lead);
  transaction.zadd(LEADS_INDEX_KEY, { score: Date.parse(lead.createdAt), member: lead.id });
  await transaction.exec();
}

export async function saveLead(lead: Lead): Promise<void> {
  await requireRedis().set(leadKey(lead.id), lead);
}

export async function removeLead(id: string): Promise<void> {
  const transaction = requireRedis().multi();
  transaction.zrem(LEADS_INDEX_KEY, id);
  transaction.del(leadKey(id));
  await transaction.exec();
}
