'use server';

import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  credentialsMatch,
  getAdminCredentials,
  requireAdmin,
  signSession,
} from '@/lib/admin/auth';
import {
  PREVIEW_CACHE_TAG,
  PREVIEW_DISABLED_MARKER,
  isPreviewSlug,
  previewCacheTag,
} from '@/lib/client-preview-source';
import { del, list, put } from '@vercel/blob';
import { dangerouslyDeleteByTag, invalidateByTag } from '@vercel/functions';
import { updateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export type LoginState = { error: string | null };

const FAILED_LOGIN_DELAY_MS = 400;
const DELETE_BATCH_SIZE = 100;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

async function listPreviewPathnames(slug: string): Promise<string[]> {
  const pathnames: string[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    // The trailing slash keeps `heris` from matching `heris-x`.
    const page = await list({ mode: 'expanded', prefix: `${slug}/`, cursor });
    for (const blob of page.blobs) pathnames.push(blob.pathname);
    cursor = page.cursor;
    hasMore = page.hasMore;
  }
  return pathnames;
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const credentials = getAdminCredentials();
  if (!credentials) notFound();

  const userMatches = credentialsMatch(field(formData, 'user'), credentials.user);
  const passwordMatches = credentialsMatch(field(formData, 'password'), credentials.password);
  if (!userMatches || !passwordMatches) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return { error: 'Usuário ou senha inválidos.' };
  }

  (await cookies()).set(
    ADMIN_SESSION_COOKIE,
    signSession(credentials, Date.now() + SESSION_TTL_MS),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/admin',
      maxAge: SESSION_TTL_MS / 1000,
    },
  );
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await requireAdmin();
  (await cookies()).delete({ name: ADMIN_SESSION_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

export async function refreshIndex(): Promise<void> {
  await requireAdmin();
  updateTag(PREVIEW_CACHE_TAG);
  await invalidateByTag(PREVIEW_CACHE_TAG);
}

export async function purgePreview(slug: string): Promise<void> {
  await requireAdmin();
  if (!isPreviewSlug(slug)) return;
  await invalidateByTag(previewCacheTag(slug));
  updateTag(PREVIEW_CACHE_TAG);
}

export async function disablePreview(slug: string): Promise<void> {
  await requireAdmin();
  if (!isPreviewSlug(slug)) return;
  // put() rejects an empty body, and only the pathname matters to the index.
  await put(`${slug}/${PREVIEW_DISABLED_MARKER}`, 'disabled', {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  updateTag(PREVIEW_CACHE_TAG);
  // invalidateByTag would still serve each cached file once more.
  await dangerouslyDeleteByTag(previewCacheTag(slug));
}

export async function enablePreview(slug: string): Promise<void> {
  await requireAdmin();
  if (!isPreviewSlug(slug)) return;
  await del(`${slug}/${PREVIEW_DISABLED_MARKER}`);
  updateTag(PREVIEW_CACHE_TAG);
}

export async function deletePreview(slug: string, formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isPreviewSlug(slug) || field(formData, 'confirmation') !== slug) return;

  let failed = false;
  try {
    const pathnames = await listPreviewPathnames(slug);
    for (let start = 0; start < pathnames.length; start += DELETE_BATCH_SIZE) {
      await del(pathnames.slice(start, start + DELETE_BATCH_SIZE));
    }
  } catch {
    failed = true;
  }

  updateTag(PREVIEW_CACHE_TAG);
  await dangerouslyDeleteByTag(previewCacheTag(slug));
  redirect(failed ? `/admin/${slug}?delete=failed` : '/admin');
}
