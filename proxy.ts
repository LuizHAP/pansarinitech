// proxy.ts (repo root) — D-09
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // D-09: exclude api, static, image-optim, files-with-extensions
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
