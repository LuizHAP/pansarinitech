import { type PreviewIndex, isPreviewSlug } from '@/lib/client-preview-source';
import { z } from 'zod';

export const LEAD_STAGES = [
  'prospectado',
  'previa-pronta',
  'contatado',
  'em-conversa',
  'proposta',
  'fechado',
  'perdido',
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const BOARD_STAGES: readonly LeadStage[] = LEAD_STAGES.slice(0, 6);

export const STAGE_LABELS: Record<LeadStage, string> = {
  prospectado: 'Prospectado',
  'previa-pronta': 'Prévia pronta',
  contatado: 'Contatado',
  'em-conversa': 'Em conversa',
  proposta: 'Proposta',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export const LEAD_SOURCES = ['google-maps', 'instagram', 'facebook', 'indicacao', 'outro'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  'google-maps': 'Google Maps',
  instagram: 'Instagram',
  facebook: 'Facebook',
  indicacao: 'Indicação',
  outro: 'Outro',
};

export type SelectOption = { value: string; label: string };

export const STAGE_OPTIONS: SelectOption[] = LEAD_STAGES.map((value) => ({
  value,
  label: STAGE_LABELS[value],
}));
export const SOURCE_OPTIONS: SelectOption[] = LEAD_SOURCES.map((value) => ({
  value,
  label: SOURCE_LABELS[value],
}));

export type StageChange = { stage: LeadStage; at: string };

export type LeadInput = {
  name: string;
  website: string | null;
  source: LeadSource;
  sourceUrl: string | null;
  whatsapp: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  previewSlug: string | null;
  nextStep: string | null;
  dueDate: string | null;
  notes: string | null;
};

export type Lead = LeadInput & {
  id: string;
  stage: LeadStage;
  history: StageChange[];
  createdAt: string;
  updatedAt: string;
};

export const LEAD_FORM_FIELDS = [
  'name',
  'website',
  'source',
  'sourceUrl',
  'whatsapp',
  'email',
  'phone',
  'instagram',
  'previewSlug',
  'nextStep',
  'dueDate',
  'notes',
  'stage',
] as const;
export type LeadFormField = (typeof LEAD_FORM_FIELDS)[number];
export type LeadFormValues = Record<LeadFormField, string>;
export type LeadFormErrors = Partial<Record<LeadFormField, string>>;

export type LeadPreviewStatus = 'active' | 'disabled' | 'missing' | 'unknown';

export const PREVIEW_STATUS_LABELS: Record<LeadPreviewStatus, string> = {
  active: 'Prévia ativa',
  disabled: 'Prévia desativada',
  missing: 'Prévia não encontrada',
  unknown: 'Status da prévia indisponível',
};

const LEAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const INSTAGRAM_PROFILE = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)\/?(?:[?#].*)?$/i;
const DATE_ONLY = z.iso.date();
const EMAIL = z.email();

const URL_ERROR = 'Informe um endereço válido, como exemplo.com.br.';

function text(max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `Use no máximo ${max} caracteres.` });
}

function optional(base: z.ZodString, normalize: (value: string) => string | null, error: string) {
  return base.transform((value, ctx) => {
    if (value === '') return null;
    const normalized = normalize(value);
    if (normalized === null) {
      ctx.addIssue(error);
      return z.NEVER;
    }
    return normalized;
  });
}

function optionalText(max: number) {
  return text(max).transform((value) => value || null);
}

function normalizeUrl(value: string): string | null {
  const candidate = URL_SCHEME.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    const web = url.protocol === 'https:' || url.protocol === 'http:';
    return web && url.hostname.includes('.') ? candidate : null;
  } catch {
    return null;
  }
}

function normalizeWhatsapp(value: string): string | null {
  let digits = value.replace(/\D/g, '').replace(/^0+/, '');
  // A Brazilian number typed with its DDD but no country code.
  if (!value.startsWith('+') && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

function normalizePhone(value: string): string | null {
  return /^\d{8,15}$/.test(value.replace(/\D/g, '')) ? value : null;
}

function normalizeInstagram(value: string): string | null {
  const handle = value.match(INSTAGRAM_PROFILE)?.[1] ?? value.replace(/^@/, '');
  return INSTAGRAM_HANDLE.test(handle) ? handle : null;
}

const leadInputSchema = z.object({
  name: text(120).min(1, { error: 'Informe o nome do negócio.' }),
  website: optional(text(500), normalizeUrl, URL_ERROR),
  source: z.enum(LEAD_SOURCES, { error: 'Escolha de onde veio o lead.' }),
  sourceUrl: optional(text(500), normalizeUrl, URL_ERROR),
  whatsapp: optional(
    text(30),
    normalizeWhatsapp,
    'Informe o WhatsApp com DDD, como (11) 91234-5678.',
  ),
  email: optional(
    text(254),
    (value) => (EMAIL.safeParse(value).success ? value : null),
    'Informe um e-mail válido.',
  ),
  phone: optional(text(30), normalizePhone, 'Informe o telefone com DDD.'),
  instagram: optional(text(100), normalizeInstagram, 'Informe o @ ou o link do perfil.'),
  previewSlug: optional(
    text(100),
    (value) => (isPreviewSlug(value) ? value : null),
    'Escolha uma prévia da lista.',
  ),
  nextStep: optionalText(200),
  dueDate: optional(
    z.string().trim(),
    (value) => (DATE_ONLY.safeParse(value).success ? value : null),
    'Informe uma data válida.',
  ),
  notes: optionalText(5000),
});

export function isLeadId(value: string): boolean {
  return LEAD_ID.test(value);
}

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === 'string' && (LEAD_STAGES as readonly string[]).includes(value);
}

export function readLeadForm(formData: FormData): LeadFormValues {
  const entries = LEAD_FORM_FIELDS.map((name) => {
    const value = formData.get(name);
    return [name, typeof value === 'string' ? value : ''];
  });
  return Object.fromEntries(entries) as LeadFormValues;
}

export function leadFormValues(lead?: Lead): LeadFormValues {
  if (!lead) {
    return {
      name: '',
      website: '',
      source: 'google-maps',
      sourceUrl: '',
      whatsapp: '',
      email: '',
      phone: '',
      instagram: '',
      previewSlug: '',
      nextStep: '',
      dueDate: '',
      notes: '',
      stage: 'prospectado',
    };
  }
  return {
    name: lead.name,
    website: lead.website ?? '',
    source: lead.source,
    sourceUrl: lead.sourceUrl ?? '',
    // Without the "+", a stored foreign number of 10 or 11 digits would get a second 55.
    whatsapp: lead.whatsapp ? `+${lead.whatsapp}` : '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    instagram: lead.instagram ? `@${lead.instagram}` : '',
    previewSlug: lead.previewSlug ?? '',
    nextStep: lead.nextStep ?? '',
    dueDate: lead.dueDate ?? '',
    notes: lead.notes ?? '',
    stage: lead.stage,
  };
}

export function parseLeadInput(
  values: LeadFormValues,
): { ok: true; input: LeadInput } | { ok: false; errors: LeadFormErrors } {
  const result = leadInputSchema.safeParse(values);
  if (result.success) return { ok: true, input: result.data };

  const errors: LeadFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as LeadFormField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

export function parseInitialStage(value: string): LeadStage | null {
  if (value === '') return 'prospectado';
  return isLeadStage(value) ? value : null;
}

export function whatsappHref(digits: string): string {
  return `https://wa.me/${digits}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '')}`;
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

export function instagramHref(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isOverdue(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate < today;
}

export function formatDueDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function byUrgency(a: Lead, b: Lead): number {
  if (a.dueDate === b.dueDate) return b.updatedAt.localeCompare(a.updatedAt);
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate.localeCompare(b.dueDate);
}

export function groupLeadsByStage(leads: readonly Lead[]): Record<LeadStage, Lead[]> {
  const grouped = Object.fromEntries(LEAD_STAGES.map((stage) => [stage, [] as Lead[]])) as Record<
    LeadStage,
    Lead[]
  >;
  for (const lead of leads) grouped[lead.stage].push(lead);
  for (const stage of LEAD_STAGES) grouped[stage].sort(byUrgency);
  return grouped;
}

export function previewStatus(index: PreviewIndex, slug: string): LeadPreviewStatus {
  if (!index.available) return 'unknown';
  const preview = index.previews.find((item) => item.slug === slug);
  if (!preview) return 'missing';
  if (preview.disabled) return 'disabled';
  return preview.hasIndex ? 'active' : 'missing';
}

export function leadPreviewOptions(index: PreviewIndex, current: string | null): SelectOption[] {
  const options = index.previews
    .filter((preview) => isPreviewSlug(preview.slug))
    .sort((a, b) => a.client.localeCompare(b.client, 'pt-BR'))
    .map((preview) => ({
      value: preview.slug,
      label: `${preview.client} (${preview.slug})${preview.disabled ? ' · desativada' : ''}`,
    }));
  if (current && !options.some((option) => option.value === current)) {
    options.push({ value: current, label: `${current} (fora do índice)` });
  }
  return [{ value: '', label: 'Nenhuma' }, ...options];
}
