import { digits } from '@/lib/crm/wa';
import { guard, json, redisOr503, resolvePhone } from '@/lib/crm/wa-server';

export async function GET(request: Request): Promise<Response> {
  const denied = await guard();
  if (denied) return denied;
  const redis = redisOr503();
  if (redis instanceof Response) return redis;
  const phone = digits(new URL(request.url).searchParams.get('phone'));
  if (phone.length < 8) return json({ error: 'Telefone inválido' }, 400);
  const { chat, lead } = await resolvePhone(redis, phone);
  return json({
    phone,
    chat,
    lead: lead ? { id: lead.id, name: lead.name, stage: lead.stage } : null,
  });
}
