'use client';
// src/components/shared/command-palette.tsx
// Phase 01 — Cmd+K command palette (UX-01 to UX-07).
//
// Exports:
//   - CommandPalette: dialog shell + command list (controlled open/onOpenChange)
//   - CommandPaletteTrigger: header trigger button (props: onOpen)
//   - CommandPaletteRoot: thin wrapper holding useState for open; renders trigger
//     alongside the palette. Header RSC renders this single client child (Option B).
//
// D-05: runCommand closes dialog THEN executes action (requestAnimationFrame).
// T-01-P2-03: all window.open calls use 'noopener'.
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui';
import { contact } from '@/data/contact';
import { useRouter } from '@/lib/i18n/navigation';
import {
  BookOpen,
  Briefcase,
  Code2,
  ExternalLink,
  FileText,
  Home,
  Languages,
  Layers,
  Mail,
  Search,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { switchLocale } from './locale-toggle-action';

// ---------------------------------------------------------------------------
// CommandPalette — controlled dialog shell + full command list
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [open, onOpenChange]);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Close-then-act: ensures dialog overlay is gone before action executes (D-05).
  function runCommand(action: () => void) {
    onOpenChange(false);
    requestAnimationFrame(action);
  }

  function scrollTo(id: string) {
    runCommand(() =>
      document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      }),
    );
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      showCloseButton={true}
      className="border border-ink-line font-mono"
    >
      <CommandInput placeholder={t('placeholder')} />
      <CommandList>
        <CommandEmpty>{t('empty')}</CommandEmpty>

        {/* Navigate group */}
        <CommandGroup heading={t('groupNavigate')}>
          <CommandItem onSelect={() => scrollTo('hero')}>
            <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navHero')}
          </CommandItem>
          <CommandItem onSelect={() => scrollTo('about')}>
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navAbout')}
          </CommandItem>
          <CommandItem onSelect={() => scrollTo('projects')}>
            <Code2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navProjects')}
          </CommandItem>
          <CommandItem onSelect={() => scrollTo('skills')}>
            <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navSkills')}
          </CommandItem>
          <CommandItem onSelect={() => scrollTo('career')}>
            <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navCareer')}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/blog'))}>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navBlog')}
          </CommandItem>
          <CommandItem onSelect={() => scrollTo('contact')}>
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navContact')}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Actions group */}
        <CommandGroup heading={t('groupActions')}>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                switchLocale('pt');
              })
            }
          >
            <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('actionSwitchPt')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                switchLocale('en');
              })
            }
          >
            <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('actionSwitchEn')}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Links group */}
        <CommandGroup heading={t('groupLinks')}>
          <CommandItem
            onSelect={() =>
              runCommand(() => window.open(contact.resumePdf.pt, '_blank', 'noopener,noreferrer'))
            }
          >
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkResumePt')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => window.open(contact.resumePdf.en, '_blank', 'noopener,noreferrer'))
            }
          >
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkResumeEn')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => window.open(contact.linkedin, '_blank', 'noopener,noreferrer'))
            }
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkLinkedin')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => window.open(contact.github, '_blank', 'noopener,noreferrer'))
            }
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkGithub')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// ---------------------------------------------------------------------------
// CommandPaletteTrigger — header button that opens the palette (D-08, D-09)
// ---------------------------------------------------------------------------

interface CommandPaletteTriggerProps {
  onOpen: () => void;
}

export function CommandPaletteTrigger({ onOpen }: CommandPaletteTriggerProps) {
  const t = useTranslations('commandPalette');

  return (
    <button
      type="button"
      aria-label={t('triggerLabel')}
      onClick={onOpen}
      className="inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-2 rounded-md px-2 font-mono text-ink-body transition-colors hover:bg-ink-card hover:text-paper"
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="hidden rounded border border-ink-line px-1.5 py-0.5 text-xs text-ink-muted md:inline">
        ⌘K
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// CommandPaletteRoot — thin wrapper that owns open state (Option B)
// Header RSC renders this single client child; portal covers full viewport.
// ---------------------------------------------------------------------------

export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener('pansarini:palette', openPalette);
    return () => window.removeEventListener('pansarini:palette', openPalette);
  }, []);

  return (
    <>
      <CommandPaletteTrigger onOpen={() => setOpen(true)} />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
