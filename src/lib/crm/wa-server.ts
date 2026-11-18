import { randomUUID } from 'node:crypto';
import { ADMIN_SESSION_COOKIE, getAdminCredentials, verifySession } from '@/lib/admin/auth';
import { findLead, getLeadsRedis, insertLead, listLeads } from '@/lib/admin/lead-store';
import type { Lead } from '@/lib/admin/leads';
import {
  WA_HEARTBEAT_MAX_AGE_MS,
  WA_KEYS,
  WA_MAX_MESSAGES_PER_CHAT,
  type WaChat,
  type WaCommand,
  type WaMessage,
  type WaOutboxItem,
  type WaSendResult,
  type WaStatus,
} from '@/lib/crm/contract';
import {
  chatTitle,
  digits,
  findLeadByPhone,
  isWorkerOnline,
  pickKnownJid,
  sortMessages,
} from '@/lib/crm/wa';
import type { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';

export type StatusPayload = {
  status: WaStatus['status'];
  qr: string | null;
  me: string | null;
  workerOnline: boolean;
};

export async function guard(): Promise<Response | null> {
  const credentials = getAdminCredentials();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!credentials || !verifySession(token, credentials)) {
    return json({ error: 'Não autorizado' }, 404);
  }
  return null;
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function redisOr503(): Redis | Response {
  return getLeadsRedis() ?? json({ error: 'Redis indisponível' }, 503);
}

export async function readStatus(redis: Redis): Promise<StatusPayload> {
  const raw = await redis.get<WaStatus>(WA_KEYS.status);
  const workerOnline = isWorkerOnline(raw, Date.now(), WA_HEARTBEAT_MAX_AGE_MS);
  if (!raw || !workerOnline)
    return { status: 'offline', qr: null, me: raw?.me ?? null, workerOnline };
  return { status: raw.status, qr: raw.qr, me: raw.me, workerOnline };
}

export async function enqueueCommand(redis: Redis, type: WaCommand['type']): Promise<void> {
  const command: WaCommand = { id: randomUUID(), type, at: Date.now() };
  await redis.rpush(WA_KEYS.commands, command);
}

export async function listChats(redis: Redis, limit = 200): Promise<WaChat[]> {
  const jids = await redis.zrange<string[]>(WA_KEYS.chatsIndex, 0, limit - 1, { rev: true });
  if (jids.length === 0) return [];
  const chats = await redis.mget<(WaChat | null)[]>(...jids.map(WA_KEYS.chat));
  return chats.filter((chat): chat is WaChat => chat !== null);
}

export async function readMessages(redis: Redis, jid: string): Promise<WaMessage[]> {
  const all = await redis.hgetall<Record<string, WaMessage>>(WA_KEYS.messages(jid));
  return sortMessages(Object.values(all ?? {}), WA_MAX_MESSAGES_PER_CHAT);
}

export async function markRead(redis: Redis, jid: string): Promise<void> {
  const chat = await redis.get<WaChat>(WA_KEYS.chat(jid));
  if (chat && chat.unread > 0) await redis.set(WA_KEYS.chat(jid), { ...chat, unread: 0 });
}

export async function enqueueText(
  redis: Redis,
  phone: string,
  text: string,
  leadId: string | null,
): Promise<WaOutboxItem> {
  const now = Date.now();
  const item: WaOutboxItem = {
    id: randomUUID(),
    phone: digits(phone),
    text,
    leadId,
    campaignId: null,
    notBefore: now,
    createdAt: now,
  };
  await redis.rpush(WA_KEYS.outbox, item);
  return item;
}

export async function readSent(redis: Redis, ids: string[]): Promise<Record<string, WaSendResult>> {
  if (ids.length === 0) return {};
  const results = await redis.mget<(WaSendResult | null)[]>(...ids.map(WA_KEYS.sent));
  const out: Record<string, WaSendResult> = {};
  ids.forEach((id, index) => {
    const result = results[index];
    if (result) out[id] = result;
  });
  return out;
}

export async function resolvePhone(
  redis: Redis,
  phone: string,
): Promise<{ chat: WaChat | null; lead: Lead | null }> {
  const chats = await listChats(redis, 1000);
  const jid = pickKnownJid(chats, phone);
  const chat = chats.find((item) => item.jid === jid) ?? null;
  const { leads } = await listLeads();
  return { chat, lead: findLeadByPhone(leads, phone) };
}

export async function createLeadFromChat(
  redis: Redis,
  jid: string,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const chat = await redis.get<WaChat>(WA_KEYS.chat(jid));
  if (!chat) return { ok: false, error: 'Conversa não encontrada' };
  if (chat.leadId) return { ok: true, leadId: chat.leadId };
  const phone = digits(chat.phone);
  if (!phone) return { ok: false, error: 'Conversa sem telefone conhecido' };

  const now = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    name: chatTitle(chat).slice(0, 120),
    website: null,
    source: 'outro',
    sourceUrl: null,
    whatsapp: phone,
    email: null,
    phone: null,
    instagram: null,
    previewSlug: null,
    nextStep: null,
    dueDate: null,
    notes: null,
    stage: 'em-conversa',
    history: [{ stage: 'em-conversa', at: now }],
    createdAt: now,
    updatedAt: now,
  };
  await insertLead(lead);
  await redis.set(WA_KEYS.chat(jid), { ...chat, leadId: lead.id });
  return { ok: true, leadId: lead.id };
}

export async function leadSummary(
  leadId: string | null,
): Promise<{ id: string; name: string; stage: Lead['stage'] } | null> {
  if (!leadId) return null;
  const { lead } = await findLead(leadId);
  return lead ? { id: lead.id, name: lead.name, stage: lead.stage } : null;
}
