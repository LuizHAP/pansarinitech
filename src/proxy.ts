// src/proxy.ts — D-09 (Next 16 proxy file convention; lives in src/ when --src-dir is used)
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // D-09: exclude api, static, image-optim, files-with-extensions
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
