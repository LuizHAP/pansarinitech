import { type Lead, type LeadStage, SOURCE_LABELS, STAGE_LABELS } from '@/lib/admin/leads';

export type BaseFilter = { q: string; stage: LeadStage | null };

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export function parseBaseFilter(params: Params): BaseFilter {
  const stage = first(params.etapa);
  return {
    q: first(params.q).trim().slice(0, 80),
    stage: stage in STAGE_LABELS ? (stage as LeadStage) : null,
  };
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function filterBase(leads: readonly Lead[], filter: BaseFilter): Lead[] {
  const needle = normalize(filter.q);
  return leads.filter((lead) => {
    if (filter.stage && lead.stage !== filter.stage) return false;
    if (!needle) return true;
    const haystack = [
      lead.name,
      lead.extras?.category,
      lead.extras?.city,
      lead.whatsapp,
      lead.phone,
      lead.email,
      lead.website,
    ]
      .filter(Boolean)
      .join(' ');
    return normalize(haystack).includes(needle);
  });
}

function cell(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function leadsToCsv(leads: readonly Lead[]): string {
  const header = [
    'nome',
    'categoria',
    'cidade',
    'etapa',
    'score',
    'prioridade',
    'whatsapp',
    'telefone',
    'email',
    'site',
    'instagram',
    'avaliacao',
    'avaliacoes',
    'origem',
  ];
  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.extras?.category,
      lead.extras?.city,
      STAGE_LABELS[lead.stage],
      lead.extras?.score?.value,
      lead.extras?.score?.priority,
      lead.whatsapp,
      lead.phone,
      lead.email,
      lead.website,
      lead.instagram,
      lead.extras?.rating,
      lead.extras?.reviews,
      SOURCE_LABELS[lead.source],
    ]
      .map(cell)
      .join(','),
  );
  return `${[header.join(','), ...rows].join('\n')}\n`;
}
