import type { Lead } from '@/lib/admin/leads';
import {
  STAGE_AFTER_INBOUND_FROM,
  STAGE_AFTER_OUTBOUND_FROM,
  type WaChat,
  type WaMessage,
  type WaOutboxItem,
} from '@/lib/crm/contract';

export const digits = (value: string | null | undefined): string =>
  (value ?? '').replace(/\D/g, '');

// Last 8 digits ignore the country code and the Brazilian 9th digit.
export function phoneKey(value: string | null | undefined): string | null {
  const d = digits(value);
  return d.length >= 8 ? d.slice(-8) : null;
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = phoneKey(a);
  return left !== null && left === phoneKey(b);
}

export function phoneFromJid(jid: string | null | undefined): string | null {
  if (!jid?.endsWith('@s.whatsapp.net')) return null;
  const d = digits(jid.split('@')[0].split(':')[0]);
  return d || null;
}

export function isIgnoredJid(jid: string): boolean {
  return jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter');
}

export function formatPhone(phone: string | null | undefined): string {
  const d = digits(phone);
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    const split = rest.length - 4;
    return `+55 (${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
  }
  return d ? `+${d}` : '';
}

export function chatTitle(chat: Pick<WaChat, 'name' | 'phone' | 'jid'>): string {
  return chat.name || formatPhone(chat.phone) || chat.jid.split('@')[0];
}

type MessageContent = {
  conversation?: string | null;
  extendedTextMessage?: { text?: string | null } | null;
  imageMessage?: { caption?: string | null } | null;
  videoMessage?: { caption?: string | null } | null;
  audioMessage?: object | null;
  documentMessage?: { fileName?: string | null } | null;
  stickerMessage?: object | null;
};

export function extractMessage(
  content: MessageContent | null | undefined,
): { body: string; type: WaMessage['type'] } | null {
  if (!content) return null;
  if (content.conversation) return { body: content.conversation, type: 'text' };
  if (content.extendedTextMessage?.text) {
    return { body: content.extendedTextMessage.text, type: 'text' };
  }
  if (content.imageMessage)
    return { body: content.imageMessage.caption || '[imagem]', type: 'image' };
  if (content.videoMessage)
    return { body: content.videoMessage.caption || '[vídeo]', type: 'video' };
  if (content.audioMessage) return { body: '[áudio]', type: 'audio' };
  if (content.documentMessage) {
    return {
      body: `[documento] ${content.documentMessage.fileName ?? ''}`.trim(),
      type: 'document',
    };
  }
  if (content.stickerMessage) return { body: '[figurinha]', type: 'sticker' };
  return null;
}

export function findLeadByPhone(leads: readonly Lead[], phone: string | null): Lead | null {
  const key = phoneKey(phone);
  if (!key) return null;
  return (
    leads.find((lead) => phoneKey(lead.whatsapp) === key) ??
    leads.find((lead) => !lead.whatsapp && phoneKey(lead.phone) === key) ??
    null
  );
}

export function leadPhone(lead: Pick<Lead, 'whatsapp' | 'phone'>): string | null {
  return digits(lead.whatsapp ?? lead.phone) || null;
}

export type Direction = 'out' | 'in';

export function applyStageAutomation(lead: Lead, direction: Direction, tsMs: number): Lead {
  const at = new Date(tsMs).toISOString();
  const from = direction === 'out' ? STAGE_AFTER_OUTBOUND_FROM : STAGE_AFTER_INBOUND_FROM;
  const to = direction === 'out' ? 'contatado' : 'em-conversa';
  const moves = from.includes(lead.stage);
  const extras = {
    ...lead.extras,
    ...(direction === 'out' ? { lastContactAt: at } : { lastReplyAt: at }),
  };
  return {
    ...lead,
    extras,
    stage: moves ? to : lead.stage,
    history: moves ? [...lead.history, { stage: to, at }] : lead.history,
    updatedAt: at,
  };
}

export function mergeChat(
  existing: WaChat | null,
  incoming: {
    jid: string;
    phone: string | null;
    name: string | null;
    ts: number;
    body: string;
    unreadInc: number;
    leadId: string | null;
  },
): WaChat {
  if (!existing) {
    return {
      jid: incoming.jid,
      phone: incoming.phone,
      name: incoming.name,
      lastTs: incoming.ts,
      lastBody: incoming.body,
      unread: incoming.unreadInc,
      leadId: incoming.leadId,
    };
  }
  const newer = incoming.ts >= existing.lastTs;
  return {
    ...existing,
    phone: existing.phone ?? incoming.phone,
    name: incoming.name ?? existing.name,
    lastTs: Math.max(existing.lastTs, incoming.ts),
    lastBody: newer ? incoming.body : existing.lastBody,
    unread: existing.unread + incoming.unreadInc,
    leadId: existing.leadId ?? incoming.leadId,
  };
}

export function splitOutbox(
  items: readonly WaOutboxItem[],
  now: number,
): { due: WaOutboxItem[]; later: WaOutboxItem[] } {
  const due = items
    .filter((item) => item.notBefore <= now)
    .sort((a, b) => a.notBefore - b.notBefore || a.createdAt - b.createdAt);
  const later = items.filter((item) => item.notBefore > now);
  return { due, later };
}

export function pickKnownJid(chats: readonly WaChat[], phone: string): string | null {
  const key = phoneKey(phone);
  if (!key) return null;
  const matches = chats.filter((chat) => phoneKey(chat.phone) === key);
  matches.sort((a, b) => b.lastTs - a.lastTs);
  return matches[0]?.jid ?? null;
}

export function sortMessages(messages: readonly WaMessage[], limit: number): WaMessage[] {
  return [...messages].sort((a, b) => a.ts - b.ts).slice(-limit);
}

export function isWorkerOnline(
  status: { heartbeatAt: number } | null,
  now: number,
  maxAge: number,
): boolean {
  return status !== null && now - status.heartbeatAt <= maxAge;
}
