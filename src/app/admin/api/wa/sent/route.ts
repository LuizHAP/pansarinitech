import { guard, json, readSent, redisOr503 } from '@/lib/crm/wa-server';

export async function GET(request: Request): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .filter(Boolean)
    .slice(0, 50);
  return json({ results: await readSent(redis, ids) });
}
