import { WA_KEYS, type WaChat } from '@/lib/crm/contract';
import { guard, json, leadSummary, readMessages, redisOr503 } from '@/lib/crm/wa-server';

export async function GET(request: Request): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  const jid = new URL(request.url).searchParams.get('jid');
  if (!jid) return json({ error: 'jid ausente' }, 400);
  const [messages, chat] = await Promise.all([
    readMessages(redis, jid),
    redis.get<WaChat>(WA_KEYS.chat(jid)),
  ]);
  return json({ messages, chat, lead: await leadSummary(chat?.leadId ?? null) });
}
