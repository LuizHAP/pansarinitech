'use server';

import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  credentialsMatch,
  getAdminCredentials,
  requireAdmin,
  signSession,
} from '@/lib/admin/auth';
import { PREVIEW_CACHE_TAG, isPreviewSlug, previewCacheTag } from '@/lib/client-preview-source';
import { invalidateByTag } from '@vercel/functions';
import { updateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export type LoginState = { error: string | null };

const FAILED_LOGIN_DELAY_MS = 400;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
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
