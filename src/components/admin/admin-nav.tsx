'use client';

import { logout } from '@/lib/admin/actions';
import { cn } from '@/lib/utils';
import {
  Database,
  Eye,
  Gauge,
  KanbanSquare,
  LogOut,
  type LucideIcon,
  Megaphone,
  Menu,
  MessageCircle,
  Radar,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'CRM',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: KanbanSquare },
      { href: '/admin/base', label: 'Base de leads', icon: Database },
      { href: '/admin/scoring', label: 'Lead scoring', icon: Gauge },
      { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone },
      { href: '/admin/scraper', label: 'Google Maps', icon: Radar },
    ],
  },
  {
    title: 'Sites',
    items: [{ href: '/admin', label: 'Prévias', icon: Eye, exact: true }],
  },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          {group.items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  active && 'bg-accent font-medium text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ pathname }: { pathname: string }) {
  return (
    <>
      <a href="/admin/leads" className="flex items-center gap-2 px-6 py-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <KanbanSquare className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold">Pansarini CRM</span>
      </a>
      <NavLinks pathname={pathname} />
      <form action={logout} className="border-t p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Sair
        </button>
      </form>
    </>
  );
}

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the drawer after navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith('/admin/login')) return <>{children}</>;

  return (
    <div className="min-h-dvh md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card md:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-2 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold">Pansarini CRM</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-card">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <SidebarBody pathname={pathname} />
          </aside>
        </div>
      )}

      <div className="min-w-0">{children}</div>
    </div>
  );
}
