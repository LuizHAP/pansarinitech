import { type HostLookup, assertPublicUrl, resolveHost } from './ssrf';

export type WebsiteAudit = {
  url: string;
  finalUrl: string | null;
  reachable: boolean;
  error: string | null;
  statusCode: number | null;
  https: boolean;
  loadTimeMs: number | null;
  responsive: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  hasH1: boolean;
  hasWhatsapp: boolean;
  hasForm: boolean;
  hasAnalytics: boolean;
  hasPixel: boolean;
  instagram: boolean;
};

export type AuditDeps = {
  fetch?: typeof fetch;
  resolver?: HostLookup;
  now?: () => number;
};

export const AUDIT_TIMEOUT_MS = 8000;
export const AUDIT_MAX_BYTES = 1_500_000;
export const AUDIT_MAX_REDIRECTS = 5;

const USER_AGENT = 'Mozilla/5.0 (compatible; PansariniLeadAudit/1.0)';

function emptyAudit(url: string): WebsiteAudit {
  return {
    url,
    finalUrl: null,
    reachable: false,
    error: null,
    statusCode: null,
    https: false,
    loadTimeMs: null,
    responsive: false,
    hasTitle: false,
    hasDescription: false,
    hasH1: false,
    hasWhatsapp: false,
    hasForm: false,
    hasAnalytics: false,
    hasPixel: false,
    instagram: false,
  };
}

async function readCapped(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < AUDIT_MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const merged = new Uint8Array(Math.min(total, AUDIT_MAX_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    const room = merged.length - offset;
    if (room <= 0) break;
    merged.set(chunk.subarray(0, room), offset);
    offset += Math.min(chunk.byteLength, room);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

export function analyzeHtml(
  html: string,
): Pick<
  WebsiteAudit,
  | 'responsive'
  | 'hasTitle'
  | 'hasDescription'
  | 'hasH1'
  | 'hasWhatsapp'
  | 'hasForm'
  | 'hasAnalytics'
  | 'hasPixel'
  | 'instagram'
> {
  return {
    responsive: /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html),
    hasTitle: /<title[^>]*>\s*\S[^<]*<\/title>/i.test(html),
    hasDescription: /<meta[^>]+name=["']description["'][^>]*content=["'][^"']+["']/i.test(html),
    hasH1: /<h1[\s>]/i.test(html),
    hasWhatsapp:
      /(wa\.me\/|api\.whatsapp\.com\/|web\.whatsapp\.com\/send|whatsapp:\/\/|chat\.whatsapp\.com\/)/i.test(
        html,
      ),
    hasForm: /<form[\s>]/i.test(html),
    hasAnalytics:
      /(googletagmanager\.com|google-analytics\.com|gtag\(|G-[A-Z0-9]{6,}|plausible\.io|clarity\.ms)/i.test(
        html,
      ),
    hasPixel:
      /(connect\.facebook\.net|fbq\(|googleadservices\.com|AW-\d{6,}|analytics\.tiktok\.com|snap\.licdn\.com|ads\.linkedin\.com)/i.test(
        html,
      ),
    instagram: /instagram\.com\/[A-Za-z0-9._]+/i.test(html),
  };
}

export async function auditWebsite(rawUrl: string, deps: AuditDeps = {}): Promise<WebsiteAudit> {
  const fetchImpl = deps.fetch ?? fetch;
  const resolver = deps.resolver ?? resolveHost;
  const now = deps.now ?? Date.now;
  const audit = emptyAudit(rawUrl);
  const started = now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

  try {
    let current = await assertPublicUrl(rawUrl, resolver);
    for (let hop = 0; ; hop++) {
      const response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        signal: controller.signal,
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
      });
      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel().catch(() => {});
        if (hop >= AUDIT_MAX_REDIRECTS) {
          audit.error = 'Redirecionamentos demais.';
          return audit;
        }
        current = await assertPublicUrl(new URL(location, current), resolver);
        continue;
      }

      audit.statusCode = response.status;
      audit.finalUrl = current.toString();
      audit.https = current.protocol === 'https:';
      if (response.status >= 400) {
        await response.body?.cancel().catch(() => {});
        audit.error = `Resposta HTTP ${response.status}.`;
        return audit;
      }
      const html = await readCapped(response);
      audit.loadTimeMs = now() - started;
      audit.reachable = true;
      return { ...audit, ...analyzeHtml(html) };
    }
  } catch (error) {
    audit.error =
      error instanceof Error && error.name === 'AbortError'
        ? 'Tempo esgotado.'
        : error instanceof Error
          ? error.message
          : 'Falha ao acessar o site.';
    return audit;
  } finally {
    clearTimeout(timer);
  }
}
