import { routing } from '@/i18n/routing';
// src/lib/i18n/navigation.ts — D-08
// ESLint exception: this file is the ONLY allowed importer of next/link / next/navigation.
import { createNavigation } from 'next-intl/navigation';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
