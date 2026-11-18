import { guard, json, markRead, redisOr503 } from '@/lib/crm/wa-server';

export async function POST(request: Request): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  const body = (await request.json().catch(() => null)) as { jid?: unknown } | null;
  if (typeof body?.jid !== 'string') return json({ error: 'jid ausente' }, 400);
  await markRead(redis, body.jid);
  return json({ ok: true });
}
