import { requireAdminAction } from '@/lib/admin/auth';
import { listLeads } from '@/lib/admin/lead-store';
import { filterBase, leadsToCsv, parseBaseFilter } from '@/lib/crm/base';

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminAction();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
  const filter = parseBaseFilter(Object.fromEntries(new URL(request.url).searchParams));
  const { leads } = await listLeads();
  return new Response(leadsToCsv(filterBase(leads, filter)), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="leads.csv"',
      'cache-control': 'no-store',
    },
  });
}
