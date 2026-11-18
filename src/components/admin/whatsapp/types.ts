import type { LeadStage } from '@/lib/admin/leads';
import type { WaChat, WaMessage, WaStatusValue } from '@/lib/crm/contract';

export type StatusPayload = {
  status: WaStatusValue;
  qr: string | null;
  me: string | null;
  workerOnline: boolean;
};

export type LeadRef = { id: string; name: string; stage: LeadStage };

export type Selection = { jid: string | null; phone: string | null; title: string };

export type PendingMessage = {
  id: string;
  phone: string;
  body: string;
  ts: number;
  state: 'queued' | 'failed';
  error?: string | null;
};

export type ConversationPayload = {
  messages: WaMessage[];
  chat: WaChat | null;
  lead: LeadRef | null;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/admin/api/wa/${path}`, { cache: 'no-store', ...init });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Erro ${response.status}`);
  }
  return (await response.json()) as T;
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
