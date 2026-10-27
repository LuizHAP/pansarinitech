import { listLeadsApi } from '@/lib/leads-api/handlers';

export async function GET(request: Request): Promise<Response> {
  return listLeadsApi(request);
}
