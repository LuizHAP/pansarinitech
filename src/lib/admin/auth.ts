import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type AdminCredentials = { user: string; password: string };

export function getAdminCredentials(env: NodeJS.ProcessEnv = process.env): AdminCredentials | null {
  const user = env.ADMIN_USER;
  const password = env.ADMIN_PASSWORD;
  if (!user || !password) return null;
  return { user, password };
}

export function credentialsMatch(input: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(input), digest(expected));
}

function signature({ user, password }: AdminCredentials, expiresAtMs: number): string {
  return createHmac('sha256', password).update(`${user}:${expiresAtMs}`).digest('base64url');
}

export function signSession(credentials: AdminCredentials, expiresAtMs: number): string {
  return `${expiresAtMs}.${signature(credentials, expiresAtMs)}`;
}

export function verifySession(
  token: string | undefined,
  credentials: AdminCredentials,
  nowMs = Date.now(),
): boolean {
  const parts = token?.split('.') ?? [];
  if (parts.length !== 2 || !/^\d+$/.test(parts[0])) return false;
  const expiresAtMs = Number(parts[0]);
  if (expiresAtMs <= nowMs) return false;
  return credentialsMatch(parts[1], signature(credentials, expiresAtMs));
}

export async function assertAdminEnabled(): Promise<AdminCredentials> {
  // Keeps admin routes out of build-time prerendering, where the env is absent and the 404
  // would be frozen into the build.
  await connection();
  const credentials = getAdminCredentials();
  if (!credentials) notFound();
  return credentials;
}

export async function requireAdmin(): Promise<void> {
  const credentials = await assertAdminEnabled();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifySession(token, credentials)) redirect('/admin/login');
}
