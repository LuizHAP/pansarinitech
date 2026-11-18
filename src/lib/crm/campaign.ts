import type { Lead, LeadSource, LeadStage } from '@/lib/admin/leads';
import type { Campaign, CampaignTarget } from './contract';

export const TEMPLATE_VARIABLES = [
  'nome',
  'primeiro_nome',
  'cidade',
  'categoria',
  'empresa',
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export const MAX_TEMPLATE_LENGTH = 1000;
export const MAX_TARGETS = 500;
export const DEFAULT_DAILY_LIMIT = 30;
export const MAX_DAILY_LIMIT = 100;
export const MIN_DELAY_FLOOR_SEC = 20;
export const DEFAULT_MIN_DELAY_SEC = 30;
export const DEFAULT_MAX_DELAY_SEC = 90;
export const QUEUED_STALE_MS = 10 * 60 * 1000;

export const DEFAULT_EXCLUDED_STAGES: readonly LeadStage[] = [
  'fechado',
  'perdido',
  'em-conversa',
  'proposta',
  'contraproposta',
];

export type Rng = () => number;

const VARIABLE_PATTERN = /\{\{\s*([^{}]*?)\s*\}\}/g;
const INNERMOST_GROUP = /\{([^{}]*)\}/;

export const SAMPLE_LEAD: Lead = {
  id: 'sample',
  name: 'Padaria Estrela do Sul',
  website: null,
  source: 'google-maps',
  sourceUrl: null,
  whatsapp: '5511912345678',
  email: null,
  phone: null,
  instagram: null,
  previewSlug: null,
  nextStep: null,
  dueDate: null,
  notes: null,
  extras: { category: 'Padaria', city: 'São Paulo' },
  stage: 'prospectado',
  history: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function isVariable(name: string): name is TemplateVariable {
  return (TEMPLATE_VARIABLES as readonly string[]).includes(name);
}

export function validateTemplate(template: string): string | null {
  if (template.trim() === '') return 'Escreva a mensagem da campanha.';
  if (template.length > MAX_TEMPLATE_LENGTH) {
    return `A mensagem passa de ${MAX_TEMPLATE_LENGTH} caracteres.`;
  }
  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    if (!isVariable(match[1])) {
      const known = TEMPLATE_VARIABLES.map((name) => `{{${name}}}`).join(', ');
      return `Variável desconhecida: {{${match[1]}}}. Use: ${known}.`;
    }
  }
  let rest = template.replace(VARIABLE_PATTERN, 'x');
  for (let guard = 0; guard < 200; guard++) {
    const group = INNERMOST_GROUP.exec(rest);
    if (!group) break;
    if (!group[1].includes('|')) {
      return `O trecho {${group[1]}} precisa de opções separadas por |, como {Oi|Olá}.`;
    }
    rest = rest.replace(INNERMOST_GROUP, group[1].split('|')[0]);
  }
  if (/[{}]/.test(rest)) return 'As chaves da mensagem estão desbalanceadas.';
  return null;
}

function cleanValue(value: string | null | undefined): string {
  return (value ?? '').replace(/[{}|]/g, '').replace(/\s+/g, ' ').trim();
}

export function templateValues(lead: Lead): Record<TemplateVariable, string> {
  const name = cleanValue(lead.name);
  return {
    nome: name,
    empresa: name,
    primeiro_nome: name.split(' ')[0] ?? '',
    cidade: cleanValue(lead.extras?.city),
    categoria: cleanValue(lead.extras?.category),
  };
}

function resolveSpintax(text: string, rng: Rng): string {
  let result = text;
  for (let guard = 0; guard < 200; guard++) {
    const group = INNERMOST_GROUP.exec(result);
    if (!group) break;
    const options = group[1].split('|');
    const chosen = options[Math.min(options.length - 1, Math.floor(rng() * options.length))];
    result = result.replace(INNERMOST_GROUP, () => chosen);
  }
  return result;
}

export function renderTemplate(template: string, lead: Lead, rng: Rng = Math.random): string {
  const values = templateValues(lead);
  const withValues = template.replace(VARIABLE_PATTERN, (_all, name: string) =>
    isVariable(name) ? values[name] : '',
  );
  return resolveSpintax(withValues, rng)
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function previewTemplate(template: string, lead: Lead = SAMPLE_LEAD): string {
  return renderTemplate(template, lead, () => 0);
}

export type CampaignSettingsInput = {
  dailyLimit?: number | null;
  minDelaySec?: number | null;
  maxDelaySec?: number | null;
};

export type CampaignSettings = { dailyLimit: number; minDelaySec: number; maxDelaySec: number };

export function normalizeSettings(
  input: CampaignSettingsInput,
): { ok: true; settings: CampaignSettings } | { ok: false; error: string } {
  const number = (value: number | null | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  const dailyLimit = Math.min(MAX_DAILY_LIMIT, number(input.dailyLimit, DEFAULT_DAILY_LIMIT));
  const minDelaySec = number(input.minDelaySec, DEFAULT_MIN_DELAY_SEC);
  const maxDelaySec = number(input.maxDelaySec, DEFAULT_MAX_DELAY_SEC);
  if (dailyLimit < 1) return { ok: false, error: 'O limite diário precisa ser de pelo menos 1.' };
  if (minDelaySec < MIN_DELAY_FLOOR_SEC) {
    return {
      ok: false,
      error: `O intervalo mínimo é de ${MIN_DELAY_FLOOR_SEC}s para reduzir o risco de banimento.`,
    };
  }
  if (maxDelaySec < minDelaySec) {
    return { ok: false, error: 'O intervalo máximo não pode ser menor que o mínimo.' };
  }
  return { ok: true, settings: { dailyLimit, minDelaySec, maxDelaySec } };
}

export function nextDelayMs(
  minDelaySec: number,
  maxDelaySec: number,
  rng: Rng = Math.random,
): number {
  return Math.round((minDelaySec + rng() * (maxDelaySec - minDelaySec)) * 1000);
}

const saoPauloDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function dayKey(ms: number): string {
  return saoPauloDay.format(new Date(ms));
}

export function sentToday(targets: readonly CampaignTarget[], now: number): number {
  const today = dayKey(now);
  return targets.filter(
    (target) =>
      (target.status === 'sent' || target.status === 'replied') &&
      target.sentAt !== null &&
      dayKey(target.sentAt) === today,
  ).length;
}

export function remainingToday(
  campaign: Pick<Campaign, 'dailyLimit'>,
  targets: readonly CampaignTarget[],
  now: number,
): number {
  return Math.max(0, Math.min(campaign.dailyLimit, MAX_DAILY_LIMIT) - sentToday(targets, now));
}

export type SelectionFilters = {
  stages: LeadStage[];
  sources: LeadSource[];
  minScore: number | null;
  category: string;
  city: string;
};

export const EMPTY_FILTERS: SelectionFilters = {
  stages: [],
  sources: [],
  minScore: null,
  category: '',
  city: '',
};

export type SelectionResult = {
  leads: Lead[];
  matching: number;
  noWhatsapp: number;
  inOtherCampaign: number;
  truncated: boolean;
};

function includesText(haystack: string | null | undefined, needle: string): boolean {
  return (haystack ?? '').toLowerCase().includes(needle.trim().toLowerCase());
}

export function matchesFilters(lead: Lead, filters: SelectionFilters): boolean {
  const stages = filters.stages.length > 0 ? filters.stages : null;
  if (stages ? !stages.includes(lead.stage) : DEFAULT_EXCLUDED_STAGES.includes(lead.stage)) {
    return false;
  }
  if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) return false;
  if (filters.minScore !== null && (lead.extras?.score?.value ?? -1) < filters.minScore) {
    return false;
  }
  if (filters.category.trim() && !includesText(lead.extras?.category, filters.category)) {
    return false;
  }
  if (filters.city.trim() && !includesText(lead.extras?.city, filters.city)) return false;
  return true;
}

export function selectLeads(
  leads: readonly Lead[],
  filters: SelectionFilters,
  busyLeadIds: ReadonlySet<string> = new Set(),
): SelectionResult {
  let noWhatsapp = 0;
  let inOtherCampaign = 0;
  const eligible: Lead[] = [];
  for (const lead of leads) {
    if (!matchesFilters(lead, filters)) continue;
    if (!lead.whatsapp) {
      noWhatsapp++;
      continue;
    }
    if (busyLeadIds.has(lead.id)) {
      inOtherCampaign++;
      continue;
    }
    eligible.push(lead);
  }
  eligible.sort((a, b) => (b.extras?.score?.value ?? -1) - (a.extras?.score?.value ?? -1));
  return {
    leads: eligible.slice(0, MAX_TARGETS),
    matching: eligible.length,
    noWhatsapp,
    inOtherCampaign,
    truncated: eligible.length > MAX_TARGETS,
  };
}

export function hasReplied(
  lead: Pick<Lead, 'extras'>,
  target: Pick<CampaignTarget, 'sentAt'>,
): number | null {
  const raw = lead.extras?.lastReplyAt;
  if (!raw || target.sentAt === null) return null;
  const repliedAt = Date.parse(raw);
  return Number.isFinite(repliedAt) && repliedAt > target.sentAt ? repliedAt : null;
}

export type CampaignMetrics = {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  replied: number;
  failed: number;
  skipped: number;
  replyRate: number;
  progress: number;
};

export function computeMetrics(targets: readonly CampaignTarget[]): CampaignMetrics {
  const count = (status: CampaignTarget['status']) =>
    targets.filter((target) => target.status === status).length;
  const replied = count('replied');
  const sent = count('sent') + replied;
  const failed = count('failed');
  const skipped = count('skipped');
  const total = targets.length;
  return {
    total,
    pending: count('pending'),
    queued: count('queued'),
    sent,
    replied,
    failed,
    skipped,
    replyRate: sent === 0 ? 0 : replied / sent,
    progress: total === 0 ? 0 : (sent + failed + skipped) / total,
  };
}
