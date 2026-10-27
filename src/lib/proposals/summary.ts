import { formatDueDate } from '@/lib/admin/leads';
import type { Proposal } from './schema';

export function proposalSummary(proposal: Proposal): string {
  const blocks = [
    [
      `Proposta para ${proposal.clientName}`,
      `Para: ${proposal.recipients}`,
      `Data: ${formatDueDate(proposal.date)} · válida até ${formatDueDate(proposal.validUntil)}`,
    ].join('\n'),
    `Opções:\n${proposal.options
      .map((option) =>
        [
          `${option.label}: ${option.title}`,
          `${option.price}, ${option.priceNote}`,
          ...(option.addon ? [option.addon] : []),
          ...(option.terms ? [option.terms] : []),
        ].join('\n'),
      )
      .join('\n\n')}`,
  ];
  if (proposal.scope.length > 0) {
    blocks.push(`Escopo:\n${proposal.scope.map((item) => `- ${item.title}`).join('\n')}`);
  }
  if (proposal.exclusions.length > 0) {
    blocks.push(`Não está incluso:\n${proposal.exclusions.map((item) => `- ${item}`).join('\n')}`);
  }
  if (proposal.previewUrl) blocks.push(`Prévia: ${proposal.previewUrl}`);
  return blocks.join('\n\n');
}
