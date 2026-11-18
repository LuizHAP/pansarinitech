import { ADMIN_SESSION_COOKIE, getAdminCredentials, verifySession } from '@/lib/admin/auth';
import { readScrapeOverview } from '@/lib/crm/scrape-store';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const credentials = getAdminCredentials();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!credentials || !verifySession(token, credentials)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json(await readScrapeOverview(), { headers: { 'Cache-Control': 'no-store' } });
}
