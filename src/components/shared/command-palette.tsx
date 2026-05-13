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
// D-04: palette NEVER calls document.startViewTransition — theme swap is instant.
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
import { Button } from '@/components/ui';
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
  Moon,
  Search,
  Sun,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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

  // Close-then-act: ensures dialog overlay is gone before action executes (D-05).
  function runCommand(action: () => void) {
    onOpenChange(false);
    requestAnimationFrame(action);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      showCloseButton={true}
    >
      <CommandInput placeholder={t('placeholder')} />
      <CommandList>
        <CommandEmpty>{t('empty')}</CommandEmpty>

        {/* Navigate group */}
        <CommandGroup heading={t('groupNavigate')}>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          >
            <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navHero')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          >
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navAbout')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          >
            <Code2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navProjects')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          >
            <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navSkills')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                document.getElementById('career')?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          >
            <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navCareer')}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/blog'))}>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('navBlog')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          >
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
                // D-04: direct setTheme call, no startViewTransition
                setTheme(isDark ? 'light' : 'dark');
              })
            }
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            {t('actionToggleTheme')}
          </CommandItem>
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
              runCommand(() => window.open(contact.resumePdf.pt, '_blank', 'noopener'))
            }
          >
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkResumePt')}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => window.open(contact.resumePdf.en, '_blank', 'noopener'))
            }
          >
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkResumeEn')}
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => window.open(contact.linkedin, '_blank', 'noopener'))}
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('linkLinkedin')}
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => window.open(contact.github, '_blank', 'noopener'))}
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
    <Button
      type="button"
      variant="ghost"
      aria-label={t('triggerLabel')}
      onClick={onOpen}
      className="h-11 min-w-[44px] gap-1 px-2"
    >
      <Search className="h-5 w-5" aria-hidden="true" />
      <span className="hidden md:inline text-xs text-muted-foreground">⌘K</span>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// CommandPaletteRoot — thin wrapper that owns open state (Option B)
// Header RSC renders this single client child; portal covers full viewport.
// ---------------------------------------------------------------------------

export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CommandPaletteTrigger onOpen={() => setOpen(true)} />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
