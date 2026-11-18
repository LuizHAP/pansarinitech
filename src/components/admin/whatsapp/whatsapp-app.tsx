'use client';

import { Card } from '@/components/ui/card';
import type { WaChat } from '@/lib/crm/contract';
import { chatTitle, formatPhone } from '@/lib/crm/wa';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { ChatList } from './chat-list';
import { ConnectionCard } from './connection-card';
import { Conversation } from './conversation';
import { type Selection, type StatusPayload, api } from './types';

export function WhatsappApp({ initialPhone }: { initialPhone: string | null }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [chats, setChats] = useState<WaChat[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshChats = useCallback(async () => {
    try {
      const [{ chats: next }, nextStatus] = await Promise.all([
        api<{ chats: WaChat[] }>('chats'),
        api<StatusPayload>('status'),
      ]);
      setChats(next);
      setStatus(nextStatus);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar');
    }
  }, []);

  useEffect(() => {
    void refreshChats();
    const timer = setInterval(refreshChats, 3000);
    return () => clearInterval(timer);
  }, [refreshChats]);

  useEffect(() => {
    if (!initialPhone) return;
    let cancelled = false;
    api<{ chat: WaChat | null; lead: { name: string } | null }>(`resolve?phone=${initialPhone}`)
      .then(({ chat, lead }) => {
        if (cancelled) return;
        setSelection(
          chat
            ? { jid: chat.jid, phone: chat.phone, title: chatTitle(chat) }
            : { jid: null, phone: initialPhone, title: lead?.name ?? formatPhone(initialPhone) },
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialPhone]);

  const select = useCallback(
    (chat: WaChat) => setSelection({ jid: chat.jid, phone: chat.phone, title: chatTitle(chat) }),
    [],
  );
  const ready = status?.workerOnline === true && status.status === 'connected';

  return (
    <div className="flex flex-col gap-4">
      <ConnectionCard status={status} />
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      <Card className="h-[calc(100dvh-16rem)] min-h-96 gap-0 py-0">
        <div className="grid h-full min-h-0 md:grid-cols-[20rem_1fr]">
          <div
            className={cn(
              'min-h-0 overflow-y-auto border-border md:border-r',
              selection && 'hidden md:block',
            )}
          >
            <ChatList chats={chats} selectedJid={selection?.jid ?? null} onSelect={select} />
          </div>
          <div
            className={cn(
              'min-h-0',
              !selection && 'hidden md:flex md:items-center md:justify-center',
            )}
          >
            {selection ? (
              <Conversation
                key={selection.jid ?? selection.phone ?? 'new'}
                selection={selection}
                workerReady={ready}
                onBack={() => setSelection(null)}
                onChanged={refreshChats}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Selecione uma conversa.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
