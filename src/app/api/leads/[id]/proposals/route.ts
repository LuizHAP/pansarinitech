import { createProposalApi } from '@/lib/leads-api/handlers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return createProposalApi(request, id);
}
