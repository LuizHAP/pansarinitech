import { digits } from '@/lib/crm/wa';
import { enqueueText, guard, json, redisOr503 } from '@/lib/crm/wa-server';

const MAX_TEXT = 4000;

export async function POST(request: Request): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  const body = (await request.json().catch(() => null)) as {
    phone?: unknown;
    text?: unknown;
    leadId?: unknown;
  } | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const phone = typeof body?.phone === 'string' ? digits(body.phone) : '';
  if (!text || text.length > MAX_TEXT) return json({ error: 'Mensagem inválida' }, 400);
  if (phone.length < 8) return json({ error: 'Telefone inválido' }, 400);
  const leadId = typeof body?.leadId === 'string' ? body.leadId : null;
  const item = await enqueueText(redis, phone, text, leadId);
  return json({ id: item.id, createdAt: item.createdAt });
}
