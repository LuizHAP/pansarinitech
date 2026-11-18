import type { LeadStage } from '@/lib/admin/leads';

export type LeadExtras = {
  category?: string | null;
  address?: string | null;
  city?: string | null;
  rating?: number | null;
  reviews?: number | null;
  lat?: number | null;
  lng?: number | null;
  mapsUrl?: string | null;
  scrapeJobId?: string | null;
  score?: LeadScore | null;
  lastContactAt?: string | null;
  lastReplyAt?: string | null;
};

export type LeadScore = {
  value: number;
  priority: 'alta' | 'media' | 'baixa';
  signals: Record<string, boolean | string | number | null>;
  reasons: string[];
  suggestedMessage: string | null;
  analyzedAt: string;
  engine: 'local' | 'ai';
};

export const WA_KEYS = {
  status: 'wa:status',
  commands: 'wa:commands',
  outbox: 'wa:outbox',
  chatsIndex: 'wa:chats',
  chat: (jid: string) => `wa:chat:${jid}`,
  messages: (jid: string) => `wa:msgs:${jid}`,
  sent: (outboxId: string) => `wa:sent:${outboxId}`,
} as const;

export type WaStatusValue = 'offline' | 'connecting' | 'qr' | 'connected';

export type WaStatus = {
  status: WaStatusValue;
  qr: string | null;
  me: string | null;
  heartbeatAt: number;
};

export type WaCommand = { id: string; type: 'connect' | 'logout'; at: number };

export type WaChat = {
  jid: string;
  phone: string | null;
  name: string | null;
  lastTs: number;
  lastBody: string | null;
  unread: number;
  leadId: string | null;
};

export type WaMessage = {
  id: string;
  jid: string;
  fromMe: boolean;
  body: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';
  ts: number;
  status?: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  campaignId?: string | null;
};

export type WaOutboxItem = {
  id: string;
  phone: string;
  text: string;
  leadId: string | null;
  campaignId: string | null;
  notBefore: number;
  createdAt: number;
};

export type WaSendResult = { ok: boolean; ts: number; error: string | null };

export const WA_HEARTBEAT_MAX_AGE_MS = 15_000;
export const WA_MAX_MESSAGES_PER_CHAT = 300;

export const STAGE_AFTER_OUTBOUND_FROM: readonly LeadStage[] = [
  'prospectado',
  'previa-pronta',
  'previa-enviada',
];
export const STAGE_AFTER_INBOUND_FROM: readonly LeadStage[] = [
  ...STAGE_AFTER_OUTBOUND_FROM,
  'contatado',
];

export const SCRAPE_KEYS = {
  queue: 'scrape:queue',
  jobs: 'scrape:jobs',
  job: (id: string) => `scrape:job:${id}`,
  heartbeat: 'scrape:heartbeat',
} as const;

export type ScrapeJob = {
  id: string;
  query: string;
  city: string;
  state: string | null;
  maxResults: number;
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
  found: number;
  added: number;
  duplicates: number;
  error: string | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
};

export const CAMPAIGN_KEYS = {
  index: 'campaigns:index',
  campaign: (id: string) => `campaigns:campaign:${id}`,
  targets: (id: string) => `campaigns:targets:${id}`,
  inflight: (id: string) => `campaigns:inflight:${id}`,
} as const;

export type Campaign = {
  id: string;
  name: string;
  template: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'done';
  leadIds: string[];
  startAt: number | null;
  minDelaySec: number;
  maxDelaySec: number;
  dailyLimit: number;
  createdAt: number;
  updatedAt: number;
};

export type CampaignTargetStatus = 'pending' | 'queued' | 'sent' | 'replied' | 'failed' | 'skipped';

export type CampaignTarget = {
  leadId: string;
  status: CampaignTargetStatus;
  sentAt: number | null;
  repliedAt: number | null;
  error: string | null;
};
