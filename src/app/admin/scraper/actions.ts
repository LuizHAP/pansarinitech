'use server';

import { requireAdminAction } from '@/lib/admin/auth';
import { parseScrapeRequest } from '@/lib/crm/scrape';
import { cancelScrapeJob, enqueueScrapeJob } from '@/lib/crm/scrape-store';

export type ScrapeFormState = { error: string | null; attempt: number };

export async function createScrapeJob(
  previous: ScrapeFormState,
  formData: FormData,
): Promise<ScrapeFormState> {
  await requireAdminAction();
  const parsed = parseScrapeRequest({
    query: formData.get('query'),
    city: formData.get('city'),
    state: formData.get('state'),
    maxResults: formData.get('maxResults'),
  });
  const attempt = previous.attempt + 1;
  if (!parsed.ok) return { error: parsed.error, attempt };
  try {
    await enqueueScrapeJob(parsed.request);
  } catch {
    return { error: 'Não foi possível enfileirar: o Redis está indisponível.', attempt };
  }
  return { error: null, attempt };
}

export async function cancelScrapeJobAction(id: string): Promise<boolean> {
  await requireAdminAction();
  try {
    return await cancelScrapeJob(id);
  } catch {
    return false;
  }
}
