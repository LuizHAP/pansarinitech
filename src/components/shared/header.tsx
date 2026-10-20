import { MotionToggle, TerminalLogo } from '@/components/site';
import { Link } from '@/lib/i18n/navigation';
// src/components/shared/header.tsx
// CommandPaletteRoot is dynamically imported via a client wrapper (deferred-command-palette.tsx)
// to defer its large JS bundle (10 lucide icons + shadcn/ui) until first Cmd+K press —
// reduces initial main-thread blocking, directly improving LCP.
import { useTranslations } from 'next-intl';
import { CommandPaletteRoot } from './deferred-command-palette';
import { LocaleToggle } from './locale-toggle';

const NAV_LINKS = [
  { href: '/projects', key: 'projects' },
  { href: '/blog', key: 'blog' },
  { href: '/now', key: 'now' },
] as const;

export function Header() {
  const t = useTranslations('header');
  const tNav = useTranslations('site.nav');

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-ink-rule bg-ink/82 px-4 backdrop-blur-md md:px-8">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-2 md:gap-6">
        <Link
          href="/"
          aria-label={t('brandAriaLabel')}
          className="inline-flex h-11 min-w-0 items-center rounded-md"
        >
          <TerminalLogo className="text-lg sm:text-xl" />
        </Link>
        <nav aria-label={tNav('label')} className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className="font-mono text-sm text-ink-body transition-colors hover:text-paper"
            >
              {tNav(key)}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href={{ pathname: '/', hash: 'contact' }}
            className="hidden rounded-lg bg-signal px-4 py-2.5 font-mono text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-ink sm:inline-flex"
          >
            {tNav('contact')}
          </Link>
          <LocaleToggle />
          <CommandPaletteRoot />
          <MotionToggle />
        </div>
      </div>
    </header>
  );
}
