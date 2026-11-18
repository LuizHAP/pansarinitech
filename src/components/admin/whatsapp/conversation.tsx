'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { WaMessage } from '@/lib/crm/contract';
import { formatPhone } from '@/lib/crm/wa';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatTs } from './chat-list';
import { type ConversationPayload, type PendingMessage, type Selection, api, post } from './types';

const POLL_MS = 2000;

export function Conversation({
  selection,
  workerReady,
  onBack,
  onChanged,
}: {
  selection: Selection;
  workerReady: boolean;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<ConversationPayload | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const jid = selection.jid;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    setData(null);
    setPending([]);
    setError(null);
    if (!jid) return;
    let cancelled = false;
    let readDone = false;

    async function tick() {
      try {
        const payload = await api<ConversationPayload>(
          `messages?jid=${encodeURIComponent(jid ?? '')}`,
        );
        if (cancelled) return;
        setData(payload);
        if (!readDone || (payload.chat?.unread ?? 0) > 0) {
          readDone = true;
          await post('read', { jid });
          onChanged();
        }
        const ids = pendingRef.current.filter((p) => p.state === 'queued').map((p) => p.id);
        if (ids.length > 0) {
          const { results } = await api<{
            results: Record<string, { ok: boolean; error: string | null }>;
          }>(`sent?ids=${ids.join(',')}`);
          if (cancelled) return;
          setPending((current) =>
            current.flatMap((p) => {
              const result = results[p.id];
              if (!result) return [p];
              return result.ok ? [] : [{ ...p, state: 'failed' as const, error: result.error }];
            }),
          );
        }
      } catch {
        // transient; next tick retries
      }
    }

    void tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jid, onChanged]);

  const messageCount = (data?.messages.length ?? 0) + pending.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the list grows
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messageCount]);

  const phone = data?.chat?.phone ?? selection.phone;

  async function submit() {
    const body = text.trim();
    if (!body || !phone) return;
    setError(null);
    try {
      const { id, createdAt } = await post<{ id: string; createdAt: number }>('send', {
        phone,
        text: body,
        leadId: data?.lead?.id ?? null,
      });
      setPending((current) => [...current, { id, phone, body, ts: createdAt, state: 'queued' }]);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar');
    }
  }

  async function createLead() {
    if (!jid) return;
    setCreating(true);
    setError(null);
    try {
      await post('lead', { jid });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar lead');
    } finally {
      setCreating(false);
    }
  }

  const messages: WaMessage[] = data?.messages ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onBack}
          aria-label="Voltar"
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selection.title}</p>
          {phone && <p className="text-xs text-muted-foreground">{formatPhone(phone)}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          {data?.lead ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/admin/leads/${data.lead.id}`}>Lead: {data.lead.name}</a>
            </Button>
          ) : (
            jid &&
            data?.chat && (
              <Button
                size="sm"
                variant="outline"
                disabled={creating || !phone}
                onClick={createLead}
              >
                Criar lead
              </Button>
            )
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {jid && !data && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!jid && pending.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nova conversa. A primeira mensagem sai quando o worker estiver conectado.
          </p>
        )}
        {messages.map((message) => (
          <Bubble
            key={message.id}
            fromMe={message.fromMe}
            body={message.body}
            meta={formatTs(message.ts)}
          />
        ))}
        {pending.map((p) => (
          <Bubble
            key={p.id}
            fromMe
            body={p.body}
            meta={p.state === 'queued' ? 'na fila...' : `falhou: ${p.error ?? 'erro'}`}
            muted
            failed={p.state === 'failed'}
          />
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={phone ? 'Escreva uma mensagem' : 'Conversa sem telefone conhecido'}
          disabled={!phone}
          maxLength={4000}
          className="max-h-32 min-h-9"
          rows={1}
        />
        <Button type="submit" disabled={!text.trim() || !phone}>
          Enviar
        </Button>
      </form>
      {(error || !workerReady) && (
        <p
          className={cn('px-3 pb-2 text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {error ?? 'WhatsApp desconectado: as mensagens ficam na fila até conectar.'}
        </p>
      )}
    </div>
  );
}

function Bubble({
  fromMe,
  body,
  meta,
  muted,
  failed,
}: {
  fromMe: boolean;
  body: string;
  meta: string;
  muted?: boolean;
  failed?: boolean;
}) {
  return (
    <div className={cn('flex', fromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-1.5 text-sm',
          fromMe ? 'bg-primary text-primary-foreground' : 'bg-muted',
          muted && 'opacity-70',
        )}
      >
        <p className="break-words whitespace-pre-wrap">{body}</p>
        <p
          className={cn(
            'mt-0.5 text-right text-[10px] opacity-70',
            failed && 'font-medium opacity-100',
          )}
        >
          {meta}
        </p>
      </div>
    </div>
  );
}
