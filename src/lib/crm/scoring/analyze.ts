import type { LeadScore } from '@/lib/crm/contract';
import { type AiDeps, refineWithAi } from './ai';
import { type AuditDeps, type WebsiteAudit, auditWebsite } from './audit';
import { type ScorableLead, hasOwnWebsite, scoreLead } from './score';

export type AnalyzeDeps = AuditDeps & AiDeps & { clock?: () => Date };

export async function analyzeLead(lead: ScorableLead, deps: AnalyzeDeps = {}): Promise<LeadScore> {
  let audit: WebsiteAudit | null = null;
  if (lead.website && hasOwnWebsite(lead.website)) {
    audit = await auditWebsite(lead.website, deps);
  }
  const local = scoreLead(lead, audit, deps.clock);
  return refineWithAi(lead, local, deps);
}
