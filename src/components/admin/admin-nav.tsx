'use client';

import { cn } from '@/lib/utils';
import { Eye, KanbanSquare, type LucideIcon, Megaphone, MessageCircle, Radar } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/admin/leads', label: 'Leads', icon: KanbanSquare },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone },
  { href: '/admin/scraper', label: 'Scraper', icon: Radar },
  { href: '/admin', label: 'Prévias', icon: Eye, exact: true },
];

export function AdminNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin/login')) return null;
  return (
    <nav
      aria-label="Admin"
      className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b bg-background/90 px-3 py-2 backdrop-blur"
    >
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              active && 'bg-accent text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
