'use client';

import { Badge } from '@/components/ui/badge';
import type { WaChat } from '@/lib/crm/contract';
import { chatTitle } from '@/lib/crm/wa';
import { cn } from '@/lib/utils';

const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatTs(ts: number): string {
  return timeFormat.format(new Date(ts));
}

export function ChatList({
  chats,
  selectedJid,
  onSelect,
}: {
  chats: WaChat[];
  selectedJid: string | null;
  onSelect: (chat: WaChat) => void;
}) {
  if (chats.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {chats.map((chat) => (
        <li key={chat.jid}>
          <button
            type="button"
            onClick={() => onSelect(chat)}
            className={cn(
              'flex w-full min-w-0 flex-col gap-1 px-3 py-2.5 text-left hover:bg-muted/50',
              chat.jid === selectedJid && 'bg-muted',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{chatTitle(chat)}</span>
              {chat.leadId && <Badge variant="outline">Lead</Badge>}
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatTs(chat.lastTs)}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="truncate text-xs text-muted-foreground">{chat.lastBody}</span>
              {chat.unread > 0 && (
                <Badge className="ml-auto" aria-label={`${chat.unread} não lidas`}>
                  {chat.unread}
                </Badge>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
