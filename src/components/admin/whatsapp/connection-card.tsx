'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPhone } from '@/lib/crm/wa';
import { useState } from 'react';
import { type StatusPayload, post } from './types';

function label(status: StatusPayload): string {
  if (!status.workerOnline) return 'Worker offline';
  if (status.status === 'connected') return 'Conectado';
  if (status.status === 'qr') return 'Aguardando leitura do QR';
  if (status.status === 'connecting') return 'Conectando...';
  return 'Desconectado';
}

export function ConnectionCard({ status }: { status: StatusPayload | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(type: 'connect' | 'logout') {
    setBusy(true);
    setError(null);
    try {
      await post('command', { type });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar comando');
    } finally {
      setBusy(false);
    }
  }

  if (!status) return null;
  const connected = status.workerOnline && status.status === 'connected';
  const showQr = status.workerOnline && status.status === 'qr' && status.qr;

  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center gap-3">
        <Badge variant={connected ? 'default' : status.workerOnline ? 'secondary' : 'destructive'}>
          {label(status)}
        </Badge>
        {connected && status.me && (
          <span className="text-sm text-muted-foreground">{formatPhone(status.me)}</span>
        )}
        {!status.workerOnline && (
          <span className="text-sm text-muted-foreground">
            Rode <code className="font-mono">pnpm worker</code> na sua máquina.
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {status.workerOnline && !connected && status.status !== 'qr' && (
            <Button size="sm" disabled={busy} onClick={() => send('connect')}>
              Gerar QR Code
            </Button>
          )}
          {status.workerOnline && status.status === 'connected' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => send('logout')}>
              Desconectar
            </Button>
          )}
        </div>
        {showQr && (
          <div className="flex w-full flex-col items-center gap-2">
            <img
              src={status.qr ?? ''}
              alt="QR Code do WhatsApp"
              className="size-64 rounded-lg bg-white p-2"
            />
            <p className="text-sm text-muted-foreground">
              WhatsApp &gt; Aparelhos conectados &gt; Conectar um aparelho
            </p>
          </div>
        )}
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
