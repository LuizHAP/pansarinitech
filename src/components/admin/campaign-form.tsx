'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type SelectionPreview,
  previewSelection,
  saveDraft,
  startCampaign,
} from '@/lib/admin/campaign-actions';
import {
  LEAD_SOURCES,
  LEAD_STAGES,
  type LeadSource,
  type LeadStage,
  SOURCE_LABELS,
  STAGE_LABELS,
} from '@/lib/admin/leads';
import {
  DEFAULT_DAILY_LIMIT,
  DEFAULT_EXCLUDED_STAGES,
  DEFAULT_MAX_DELAY_SEC,
  DEFAULT_MIN_DELAY_SEC,
  EMPTY_FILTERS,
  MAX_DAILY_LIMIT,
  MIN_DELAY_FLOOR_SEC,
  type SelectionFilters,
  TEMPLATE_VARIABLES,
  previewTemplate,
  validateTemplate,
} from '@/lib/crm/campaign';
import { TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

const DEFAULT_TEMPLATE =
  '{Oi|Olá}, tudo bem? Vi a {{empresa}} aí em {{cidade}} e queria te mostrar uma ideia rápida para o site de vocês.';
const SAFE_DAILY_LIMIT = 30;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Field({
  label,
  htmlFor,
  children,
}: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckGroup<T extends string>({
  legend,
  options,
  labels,
  selected,
  onChange,
  hint,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onChange: (next: T[]) => void;
  hint?: string;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(toggle(selected, option))}
            />
            {labels[option]}
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}

export function CampaignForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const templateRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [filters, setFilters] = useState<SelectionFilters>(EMPTY_FILTERS);
  const [minDelay, setMinDelay] = useState(String(DEFAULT_MIN_DELAY_SEC));
  const [maxDelay, setMaxDelay] = useState(String(DEFAULT_MAX_DELAY_SEC));
  const [dailyLimit, setDailyLimit] = useState(String(DEFAULT_DAILY_LIMIT));
  const [startAt, setStartAt] = useState('');
  const [preview, setPreview] = useState<SelectionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templateError = validateTemplate(template);
  const limit = Number(dailyLimit);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await previewSelection(template, filters);
      if (!cancelled) setPreview(result);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [template, filters]);

  const insertVariable = (variable: string) => {
    const field = templateRef.current;
    const token = `{{${variable}}}`;
    const start = field?.selectionStart ?? template.length;
    const end = field?.selectionEnd ?? template.length;
    setTemplate(`${template.slice(0, start)}${token}${template.slice(end)}`);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const submit = (andStart: boolean) => {
    setError(null);
    startTransition(async () => {
      const saved = await saveDraft({
        name,
        template,
        filters,
        settings: {
          dailyLimit: Number(dailyLimit),
          minDelaySec: Number(minDelay),
          maxDelaySec: Number(maxDelay),
        },
        startAt: startAt ? new Date(startAt).toISOString() : null,
      });
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      if (andStart) {
        const started = await startCampaign(saved.id);
        if (!started.ok) {
          setError(started.error);
          router.push(`/admin/campanhas/${saved.id}`);
          return;
        }
      }
      router.push(`/admin/campanhas/${saved.id}`);
    });
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
      }}
      className="flex flex-col gap-8"
    >
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Mensagem</h2>
        <Field label="Nome da campanha" htmlFor="campaign-name">
          <Input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field label="Texto da mensagem" htmlFor="campaign-template">
          <Textarea
            id="campaign-template"
            ref={templateRef}
            rows={6}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            aria-invalid={templateError ? true : undefined}
          />
        </Field>
        <div className="flex flex-wrap gap-2" aria-label="Variáveis">
          {TEMPLATE_VARIABLES.map((variable) => (
            <Button
              key={variable}
              type="button"
              size="xs"
              variant="outline"
              onClick={() => insertVariable(variable)}
            >
              {`{{${variable}}}`}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Use {'{Oi|Olá|E aí}'} para variar o texto: uma opção é sorteada a cada envio.
        </p>
        {templateError ? (
          <p role="alert" className="text-sm text-destructive">
            {templateError}
          </p>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">Prévia com um lead de exemplo</p>
            <p className="text-sm whitespace-pre-wrap">{previewTemplate(template)}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Quem recebe</h2>
        <CheckGroup
          legend="Etapas"
          options={LEAD_STAGES}
          labels={STAGE_LABELS}
          selected={filters.stages}
          onChange={(stages: LeadStage[]) => setFilters({ ...filters, stages })}
          hint={`Sem seleção, ficam de fora: ${DEFAULT_EXCLUDED_STAGES.map((stage) => STAGE_LABELS[stage]).join(', ')}.`}
        />
        <CheckGroup
          legend="Origens"
          options={LEAD_SOURCES}
          labels={SOURCE_LABELS}
          selected={filters.sources}
          onChange={(sources: LeadSource[]) => setFilters({ ...filters, sources })}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Score mínimo" htmlFor="campaign-score">
            <Input
              id="campaign-score"
              type="number"
              min={0}
              max={100}
              value={filters.minScore ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minScore: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Categoria contém" htmlFor="campaign-category">
            <Input
              id="campaign-category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            />
          </Field>
          <Field label="Cidade" htmlFor="campaign-city">
            <Input
              id="campaign-city"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
          </Field>
        </div>
        <div className="rounded-lg border p-3 text-sm" aria-live="polite">
          {preview ? (
            <>
              <p className="font-medium">
                {preview.count} {preview.count === 1 ? 'lead selecionado' : 'leads selecionados'}
                {preview.truncated && ' (limitado aos 500 primeiros por score)'}
              </p>
              <p className="text-xs text-muted-foreground">
                Fora da lista: {preview.noWhatsapp} sem WhatsApp, {preview.inOtherCampaign} em outra
                campanha ativa.
              </p>
              {preview.firstMessage && (
                <p className="mt-2 whitespace-pre-wrap">
                  <span className="text-xs text-muted-foreground">
                    Primeira mensagem, para {preview.firstLeadName}:
                  </span>
                  <br />
                  {preview.firstMessage}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Calculando...</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Ritmo e limites</h2>
        <Alert variant={limit > SAFE_DAILY_LIMIT ? 'destructive' : 'default'}>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Risco de banimento</AlertTitle>
          <AlertDescription>
            Disparos em volume e em intervalos curtos podem fazer o WhatsApp banir o número. Comece
            pequeno: de 10 a {SAFE_DAILY_LIMIT} mensagens por dia, com intervalos de 30 a 90
            segundos, e só aumente se não houver bloqueios. O teto é {MAX_DAILY_LIMIT} por dia.
          </AlertDescription>
        </Alert>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Limite por dia" htmlFor="campaign-limit">
            <Input
              id="campaign-limit"
              type="number"
              min={1}
              max={MAX_DAILY_LIMIT}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
            />
          </Field>
          <Field label={`Intervalo mínimo (s, mín. ${MIN_DELAY_FLOOR_SEC})`} htmlFor="campaign-min">
            <Input
              id="campaign-min"
              type="number"
              min={MIN_DELAY_FLOOR_SEC}
              value={minDelay}
              onChange={(e) => setMinDelay(e.target.value)}
            />
          </Field>
          <Field label="Intervalo máximo (s)" htmlFor="campaign-max">
            <Input
              id="campaign-max"
              type="number"
              min={MIN_DELAY_FLOOR_SEC}
              value={maxDelay}
              onChange={(e) => setMaxDelay(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Início (opcional)" htmlFor="campaign-start">
          <Input
            id="campaign-start"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="sm:max-w-xs"
          />
        </Field>
      </section>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          Salvar rascunho
        </Button>
        <Button
          type="button"
          disabled={pending || templateError !== null}
          onClick={() => submit(true)}
        >
          Salvar e iniciar
        </Button>
      </div>
    </form>
  );
}
