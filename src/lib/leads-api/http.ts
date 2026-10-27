import { credentialsMatch } from '@/lib/admin/auth';
import { contentDisposition } from '@/lib/admin/lead-files';

export const MAX_JSON_BYTES = 256 * 1024;

const BEARER = /^Bearer\s+(\S+)\s*$/i;

export function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function pdfResponse(bytes: Uint8Array, filename: string): Response {
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(filename),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function authorizeLeadsApi(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): Response | null {
  const token = env.LEADS_API_TOKEN;
  if (!token) return jsonResponse({ error: 'not_found' }, 404);
  const match = request.headers.get('authorization')?.match(BEARER);
  if (!match || !credentialsMatch(match[1], token)) {
    return jsonResponse({ error: 'unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
  }
  return null;
}

export async function readJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BYTES,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const tooLarge = () => ({
    ok: false as const,
    response: jsonResponse({ error: 'payload_too_large' }, 413),
  });
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return tooLarge();
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) return tooLarge();
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: jsonResponse({ errors: [{ path: '', message: 'JSON inválido.' }] }, 400),
    };
  }
}
