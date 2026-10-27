import { ADMIN_SESSION_COOKIE } from '@/lib/admin/auth';
import { serveRecordFile } from '@/lib/admin/lead-files';
import { cookies } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> },
): Promise<Response> {
  const { id, recordId } = await params;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return serveRecordFile(id, recordId, token);
}
