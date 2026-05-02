// src/proxy.ts — D-09 (Next 16 proxy file convention; lives in src/ when --src-dir is used)
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // D-09: exclude api, static, image-optim, files-with-extensions
  // Phase 4 (Plan 04-03): also exclude top-level Route Handlers without
  // file extensions — `icon`, `apple-icon` (Next 16 emits them at extension-less
  // paths but serves PNG content). Without this exemption next-intl's middleware
  // 307-redirects them to /en/icon, /en/apple-icon → 404. T-04-32.
  matcher: ['/((?!api|_next/static|_next/image|icon|apple-icon|.*\\..*).*)'],
};
