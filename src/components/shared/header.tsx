import { Link } from '@/lib/i18n/navigation';
// src/components/shared/header.tsx
// 56px sticky header — D-20: brand + locale toggle + command palette trigger + theme toggle.
// CommandPaletteRoot is dynamically imported via a client wrapper (deferred-command-palette.tsx)
// to defer its large JS bundle (10 lucide icons + shadcn/ui) until first Cmd+K press —
// reduces initial main-thread blocking, directly improving LCP.
import { useTranslations } from 'next-intl';
import { CommandPaletteRoot } from './deferred-command-palette';
import { LocaleToggle } from './locale-toggle';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const t = useTranslations('header');

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-muted px-4 md:px-6">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4">
        <Link
          href="/"
          aria-label={t('brandAriaLabel')}
          className="text-base font-semibold text-foreground"
        >
          Luiz Pansarini
        </Link>
        <div className="flex-1" />
        <LocaleToggle />
        <CommandPaletteRoot />
        <ThemeToggle />
      </div>
    </header>
  );
}
