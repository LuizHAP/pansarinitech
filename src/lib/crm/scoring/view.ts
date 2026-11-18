import type { Lead } from '@/lib/admin/leads';
import type { LeadScore } from '@/lib/crm/contract';

export const SCORE_BATCH_SIZE = 10;
export const SCORE_CONCURRENCY = 3;

export const PRIORITY_LABELS: Record<LeadScore['priority'], string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const PRIORITY_FILTERS = ['alta', 'media', 'baixa', 'sem'] as const;
export type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

export type LeadView = {
  priority: PriorityFilter | null;
  sort: 'score' | null;
  job: string | null;
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLeadView(params: Params): LeadView {
  const priority = first(params.prioridade);
  return {
    priority: (PRIORITY_FILTERS as readonly string[]).includes(priority ?? '')
      ? (priority as PriorityFilter)
      : null,
    sort: first(params.ordem) === 'score' ? 'score' : null,
    job: /^[\w-]{1,64}$/.test(first(params.job) ?? '') ? (first(params.job) as string) : null,
  };
}

export function leadViewHref(view: LeadView): string {
  const query = new URLSearchParams();
  if (view.priority) query.set('prioridade', view.priority);
  if (view.sort) query.set('ordem', view.sort);
  if (view.job) query.set('job', view.job);
  const text = query.toString();
  return text ? `/admin/leads?${text}` : '/admin/leads';
}

export function filterByJob(leads: readonly Lead[], job: string | null): Lead[] {
  if (!job) return [...leads];
  return leads.filter((lead) => lead.extras?.scrapeJobId === job);
}

export function filterByPriority(leads: readonly Lead[], priority: PriorityFilter | null): Lead[] {
  if (!priority) return [...leads];
  return leads.filter((lead) => {
    const score = lead.extras?.score;
    return priority === 'sem' ? !score : score?.priority === priority;
  });
}

export function sortByScore(leads: readonly Lead[]): Lead[] {
  return [...leads].sort((a, b) => (b.extras?.score?.value ?? -1) - (a.extras?.score?.value ?? -1));
}

export function unscoredLeadIds(leads: readonly Lead[]): string[] {
  return leads.filter((lead) => !lead.extras?.score).map((lead) => lead.id);
}

export type SignalTone = 'ok' | 'gap' | 'neutral';
export type SignalView = { label: string; tone: SignalTone };

const FLAGS: { key: string; good: string; bad: string; badTone?: SignalTone }[] = [
  { key: 'siteAcessivel', good: 'Site acessível', bad: 'Site fora do ar' },
  { key: 'https', good: 'HTTPS', bad: 'Sem HTTPS' },
  { key: 'responsivo', good: 'Adaptado ao celular', bad: 'Não adaptado ao celular' },
  { key: 'whatsappNoSite', good: 'WhatsApp no site', bad: 'Sem WhatsApp no site' },
  { key: 'formulario', good: 'Formulário de contato', bad: 'Sem formulário' },
  { key: 'analytics', good: 'Analytics', bad: 'Sem analytics' },
  { key: 'pixel', good: 'Pixel de anúncios', bad: 'Sem pixel de anúncios' },
  {
    key: 'instagramNoSite',
    good: 'Instagram no site',
    bad: 'Sem Instagram no site',
    badTone: 'neutral',
  },
  { key: 'whatsappContato', good: 'WhatsApp do lead', bad: 'Sem WhatsApp', badTone: 'neutral' },
  { key: 'instagram', good: 'Instagram', bad: 'Sem Instagram', badTone: 'neutral' },
];

export function describeSignals(signals: LeadScore['signals']): SignalView[] {
  const views: SignalView[] = [];
  if (signals.semSite === true) views.push({ label: 'Sem site', tone: 'gap' });
  for (const flag of FLAGS) {
    const value = signals[flag.key];
    if (value === true) views.push({ label: flag.good, tone: 'ok' });
    else if (value === false) views.push({ label: flag.bad, tone: flag.badTone ?? 'gap' });
  }
  const loadTime = signals.carregamentoMs;
  if (typeof loadTime === 'number') {
    views.push({
      label: `Carrega em ${(loadTime / 1000).toFixed(1)}s`,
      tone: loadTime > 3500 ? 'gap' : 'ok',
    });
  }
  return views;
}
