import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalDocument } from './proposal-document';
import type { Proposal } from './schema';
import { registerProposalFonts } from './theme';

export async function renderProposalPdf(input: Proposal): Promise<Buffer> {
  registerProposalFonts();
  return renderToBuffer(<ProposalDocument proposal={input} />);
}

export function proposalPdfFileName(proposal: Proposal): string {
  const slug = proposal.clientName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `proposta-${slug || 'cliente'}-${proposal.date}.pdf`;
}
