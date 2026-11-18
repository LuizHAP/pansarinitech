'use client';

import { cancelScrapeJobAction, createScrapeJob } from '@/app/admin/scraper/actions';
import type { ScrapeFormState } from '@/app/admin/scraper/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { ScrapeJob } from '@/lib/crm/contract';
import { BR_STATES, SCRAPE_DEFAULT_MAX_RESULTS, SCRAPE_MAX_RESULTS } from '@/lib/crm/scrape';
import type { ScrapeOverview } from '@/lib/crm/scrape-store';
import { TriangleAlert } from 'lucide-react';
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from 'react';

const INITIAL_FORM: ScrapeFormState = { error: null, attempt: 0 };
const POLL_ACTIVE_MS = 2000;
const POLL_IDLE_MS = 8000;

const STATUS_LABELS: Record<ScrapeJob['status'], string> = {
  queued: 'Na fila',
  running: 'Rodando',
  done: 'Concluído',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

function isActive(job: ScrapeJob): boolean {
  return job.status === 'queued' || job.status === 'running';
}

function formatDateTime(ms: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

function JobRow({ job, onCancel }: { job: ScrapeJob; onCancel: (id: string) => void }) {
  const place = job.state ? `${job.city}/${job.state}` : job.city;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {job.query} · {place}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateTime(job.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'}>
            {STATUS_LABELS[job.status]}
          </Badge>
          {isActive(job) && (
            <Button type="button" variant="outline" size="sm" onClick={() => onCancel(job.id)}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
      {isActive(job) && (
        <progress
          aria-label="Progresso da busca"
          max={job.maxResults}
          value={Math.min(job.found, job.maxResults)}
          className="h-1.5 w-full accent-primary"
        />
      )}
      <p className="text-xs text-muted-foreground">
        {job.found} de até {job.maxResults} lidos · {job.added} novos · {job.duplicates} duplicados
      </p>
      {job.error && <p className="text-xs text-destructive">{job.error}</p>}
      {!isActive(job) && job.added > 0 && (
        <a
          href={`/admin/leads?job=${job.id}`}
          className="w-fit text-xs text-primary underline-offset-4 hover:underline"
        >
          Ver {job.added === 1 ? '1 lead novo' : `${job.added} leads novos`}
        </a>
      )}
    </li>
  );
}

export function ScraperPanel({ initial }: { initial: ScrapeOverview }) {
  const [overview, setOverview] = useState(initial);
  const [formState, formAction, pending] = useActionState(createScrapeJob, INITIAL_FORM);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/admin/scraper/jobs', { cache: 'no-store' });
      if (response.ok) setOverview((await response.json()) as ScrapeOverview);
    } catch {}
  }, []);

  const active = overview.jobs.some(isActive);
  useEffect(() => {
    const timer = setInterval(refresh, active ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  const attempt = formState.attempt;
  const failed = formState.error !== null;
  useEffect(() => {
    if (attempt === 0) return;
    if (!failed) formRef.current?.reset();
    refresh();
  }, [attempt, failed, refresh]);

  function cancel(id: string) {
    startTransition(async () => {
      await cancelScrapeJobAction(id);
      await refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!overview.available && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Redis indisponível</AlertTitle>
          <AlertDescription>
            Sem KV_REST_API_URL e KV_REST_API_TOKEN não dá para enfileirar buscas.
          </AlertDescription>
        </Alert>
      )}
      {overview.available && !overview.workerOnline && (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Worker offline</AlertTitle>
          <AlertDescription>
            Rode <code>pnpm worker</code> neste computador para as buscas serem processadas. Os
            pedidos ficam na fila até lá.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nova busca</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <label htmlFor="scrape-query">Nicho</label>
              <Input
                id="scrape-query"
                name="query"
                required
                maxLength={80}
                placeholder="dentista, pet shop…"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <label htmlFor="scrape-city">Cidade</label>
              <Input id="scrape-city" name="city" required maxLength={80} placeholder="Campinas" />
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <label htmlFor="scrape-state">UF</label>
              <NativeSelect id="scrape-state" name="state" defaultValue="SP">
                {BR_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <label htmlFor="scrape-maxResults">Máximo de resultados</label>
              <Input
                id="scrape-maxResults"
                name="maxResults"
                type="number"
                min={1}
                max={SCRAPE_MAX_RESULTS}
                defaultValue={SCRAPE_DEFAULT_MAX_RESULTS}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={pending || !overview.available}>
                {pending ? 'Enfileirando…' : 'Buscar'}
              </Button>
            </div>
            {formState.error && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {formState.error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <section aria-label="Buscas" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Buscas recentes</h2>
        {overview.jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma busca ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {overview.jobs.map((job) => (
              <JobRow key={job.id} job={job} onCancel={cancel} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
