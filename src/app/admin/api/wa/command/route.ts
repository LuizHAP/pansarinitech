import { enqueueCommand, guard, json, redisOr503 } from '@/lib/crm/wa-server';

export async function POST(request: Request): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  const body = (await request.json().catch(() => null)) as { type?: unknown } | null;
  if (body?.type !== 'connect' && body?.type !== 'logout') {
    return json({ error: 'Comando inválido' }, 400);
  }
  await enqueueCommand(redis, body.type);
  return json({ ok: true });
}
