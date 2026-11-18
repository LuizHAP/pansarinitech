import type { Lead } from '@/lib/admin/leads';
import type { LeadScore } from '@/lib/crm/contract';
import type { WebsiteAudit } from './audit';

export type ScorableLead = Pick<
  Lead,
  'name' | 'website' | 'whatsapp' | 'phone' | 'email' | 'instagram'
> & { extras?: Lead['extras'] };

export const SLOW_LOAD_MS = 3500;

const SOCIAL_HOSTS =
  /(^|\.)(instagram\.com|facebook\.com|fb\.com|fb\.me|linktr\.ee|wa\.me|whatsapp\.com|google\.com|goo\.gl|maps\.app\.goo\.gl|ifood\.com\.br|youtube\.com|tiktok\.com|linkedin\.com)$/i;

const PRIORITY_CATEGORY =
  /(cl[ií]nica|odont|est[eé]tica|advoc|imobili|arquitet|construt|academia|restaurante|hotel|pousada|escola|curso|oficina|auto|turismo|delivery|m[eé]dico|dentista|barbearia|sal[aã]o|pet)/i;

export function hasOwnWebsite(website: string | null | undefined): boolean {
  if (!website) return false;
  try {
    const host = new URL(website.includes('://') ? website : `https://${website}`).hostname;
    return host.includes('.') && !SOCIAL_HOSTS.test(host);
  } catch {
    return false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function priorityFor(value: number): LeadScore['priority'] {
  if (value >= 70) return 'alta';
  if (value >= 45) return 'media';
  return 'baixa';
}

type Issue = { key: string; points: number; reason: string; pitch: string };

function siteIssues(audit: WebsiteAudit): Issue[] {
  const issues: Issue[] = [];
  const add = (key: string, points: number, reason: string, pitch: string) =>
    issues.push({ key, points, reason, pitch });
  if (!audit.https) {
    add(
      'https',
      10,
      'O site não usa HTTPS e o navegador mostra aviso de "não seguro".',
      'o site aparece como "não seguro" no navegador',
    );
  }
  if (!audit.responsive) {
    add(
      'responsivo',
      14,
      'O site não parece adaptado ao celular (sem meta viewport).',
      'o site não está adaptado pro celular',
    );
  }
  if (audit.loadTimeMs !== null && audit.loadTimeMs > SLOW_LOAD_MS) {
    add(
      'lento',
      6,
      `O site demora ${(audit.loadTimeMs / 1000).toFixed(1)}s para responder.`,
      'o site demora pra carregar',
    );
  }
  if (!audit.hasWhatsapp) {
    add(
      'semWhatsapp',
      6,
      'O site não tem botão ou link de WhatsApp.',
      'não tem botão de WhatsApp pro cliente chamar',
    );
  }
  if (!audit.hasForm)
    add(
      'semFormulario',
      3,
      'O site não tem formulário de contato.',
      'não tem formulário de contato',
    );
  if (!audit.hasAnalytics && !audit.hasPixel) {
    add(
      'semMedicao',
      4,
      'O site não tem analytics nem pixel de anúncios.',
      'não dá pra medir os acessos nem anunciar com pixel',
    );
  }
  if (!audit.hasTitle || !audit.hasDescription || !audit.hasH1) {
    add(
      'semSeoBasico',
      4,
      'Faltam título, descrição ou H1, o básico de SEO.',
      'falta o básico de SEO pra aparecer no Google',
    );
  }
  return issues;
}

function strengthPoints(lead: ScorableLead): { points: number; reasons: string[] } {
  const reviews = lead.extras?.reviews ?? 0;
  const rating = lead.extras?.rating ?? 0;
  const category = lead.extras?.category ?? '';
  let points = 0;
  if (reviews >= 200) points += 12;
  else if (reviews >= 50) points += 9;
  else if (reviews >= 10) points += 5;
  else if (reviews > 0) points += 2;
  if (rating >= 4.5) points += 8;
  else if (rating >= 4) points += 5;
  else if (rating >= 3.5) points += 2;
  if (PRIORITY_CATEGORY.test(category)) points += 5;
  else if (category) points += 2;

  const reasons: string[] = [];
  if (reviews >= 50 && rating >= 4) {
    reasons.push(`Negócio estabelecido: ${rating.toFixed(1)} de nota em ${reviews} avaliações.`);
  } else if (reviews > 0) {
    reasons.push(`${reviews} avaliações no Google${rating ? ` (nota ${rating.toFixed(1)})` : ''}.`);
  }
  return { points: Math.min(points, 25), reasons };
}

function reachPoints(lead: ScorableLead): { points: number; reasons: string[] } {
  let points = 0;
  const reasons: string[] = [];
  if (lead.whatsapp) {
    points += 14;
    reasons.push('Tem WhatsApp, dá pra abordar direto.');
  } else if (lead.phone) {
    points += 4;
    reasons.push('Só tem telefone fixo ou sem WhatsApp confirmado.');
  } else {
    reasons.push('Sem WhatsApp nem telefone: contato mais difícil.');
  }
  if (lead.email) points += 3;
  if (lead.instagram) points += 3;
  return { points: Math.min(points, 20), reasons };
}

function categoryLabel(lead: ScorableLead): string | null {
  const category = lead.extras?.category?.trim();
  return category ? category.toLowerCase() : null;
}

export function buildMessage(
  lead: ScorableLead,
  hasSite: boolean,
  issues: readonly Issue[],
): string {
  const name = lead.name.trim();
  const category = categoryLabel(lead);
  const intro = 'Oi, tudo bem? Aqui é o Luiz, sou desenvolvedor web.';
  const niche = category ? ` Trabalho com sites pra negócios de ${category}.` : '';
  if (!hasSite) {
    return `${intro} Vi a ${name} no Google e reparei que vocês ainda não têm um site próprio.${niche} Posso te mostrar uma prévia de como ficaria, sem compromisso?`;
  }
  const top = issues
    .slice()
    .sort((a, b) => b.points - a.points)
    .slice(0, 2)
    .map((issue) => issue.pitch);
  if (top.length === 0) {
    return `${intro} Dei uma olhada no site da ${name} e ficou bom.${niche} Se quiser, posso te mostrar ideias pra ele trazer mais clientes. Faz sentido conversar?`;
  }
  return `${intro} Dei uma olhada no site da ${name} e notei que ${top.join(' e ')}.${niche} Consigo resolver isso rápido. Quer que eu te mostre como ficaria?`;
}

export function scoreLead(
  lead: ScorableLead,
  audit: WebsiteAudit | null,
  now: () => Date = () => new Date(),
): LeadScore {
  const own = hasOwnWebsite(lead.website);
  const noSite = !own;
  const reasons: string[] = [];
  let issues: Issue[] = [];
  let gap = 0;
  let unreachable = false;

  if (noSite) {
    gap = lead.instagram ? 50 : 46;
    reasons.push(
      lead.website
        ? 'Sem site próprio: só tem um perfil em rede social ou link de terceiros.'
        : 'Sem site: alta chance de fechar um site ou landing page.',
    );
  } else if (!audit) {
    gap = 10;
    reasons.push('O site ainda não foi auditado.');
  } else if (!audit.reachable) {
    unreachable = true;
    gap = 32;
    reasons.push(
      `O site está fora do ar ou inacessível${audit.error ? ` (${audit.error.replace(/\.$/, '')})` : ''}.`,
    );
  } else {
    issues = siteIssues(audit);
    gap = Math.min(
      50,
      issues.reduce((sum, issue) => sum + issue.points, 0),
    );
    if (issues.length === 0)
      reasons.push('Site em bom estado, pouca margem pra oferecer melhoria.');
    for (const issue of issues
      .slice()
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)) {
      reasons.push(issue.reason);
    }
  }

  const strength = strengthPoints(lead);
  const reach = reachPoints(lead);
  reasons.push(...strength.reasons, ...reach.reasons);

  const value = clamp(Math.round(gap + strength.points + reach.points), 0, 100);
  const sitePresent = own && audit !== null && audit.reachable;

  const signals: LeadScore['signals'] = {
    semSite: noSite,
    siteAcessivel: noSite || !audit ? null : audit.reachable,
    https: sitePresent ? audit.https : null,
    responsivo: sitePresent ? audit.responsive : null,
    carregamentoMs: sitePresent ? audit.loadTimeMs : null,
    whatsappNoSite: sitePresent ? audit.hasWhatsapp : null,
    formulario: sitePresent ? audit.hasForm : null,
    analytics: sitePresent ? audit.hasAnalytics : null,
    pixel: sitePresent ? audit.hasPixel : null,
    instagramNoSite: sitePresent ? audit.instagram : null,
    whatsappContato: Boolean(lead.whatsapp),
    instagram: Boolean(lead.instagram),
    avaliacoes: lead.extras?.reviews ?? null,
    nota: lead.extras?.rating ?? null,
    categoria: lead.extras?.category ?? null,
  };

  return {
    value,
    priority: priorityFor(value),
    signals,
    reasons: reasons.slice(0, 8),
    suggestedMessage: buildMessage(lead, !noSite && !unreachable, issues),
    analyzedAt: now().toISOString(),
    engine: 'local',
  };
}
