import { guard, json, readStatus, redisOr503 } from '@/lib/crm/wa-server';

export async function GET(): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  return json(await readStatus(redis));
}
