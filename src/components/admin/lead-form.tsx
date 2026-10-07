'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { LeadFormState } from '@/lib/admin/lead-actions';
import type {
  LeadFormErrors,
  LeadFormField,
  LeadFormValues,
  SelectOption,
} from '@/lib/admin/leads';
import { cn } from '@/lib/utils';
import { useActionState } from 'react';

const INITIAL_STATE: LeadFormState = { errors: {}, message: null, values: null, attempt: 0 };

type ControlProps = {
  id: string;
  name: LeadFormField;
  defaultValue: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

function controlProps(
  field: LeadFormField,
  values: LeadFormValues,
  errors: LeadFormErrors,
): ControlProps {
  return {
    id: `lead-${field}`,
    name: field,
    defaultValue: values[field],
    ...(errors[field] ? { 'aria-invalid': true, 'aria-describedby': `lead-${field}-error` } : {}),
  };
}

function Field({
  field,
  label,
  error,
  className,
  children,
}: {
  field: LeadFormField;
  label: string;
  error: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={`lead-${field}`} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`lead-${field}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 text-base font-semibold">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Options({ options }: { options: SelectOption[] }) {
  return options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));
}

export function LeadForm({
  action,
  defaults,
  sourceOptions,
  previewOptions,
  stageOptions,
  submitLabel,
}: {
  action: (state: LeadFormState, formData: FormData) => Promise<LeadFormState>;
  defaults: LeadFormValues;
  sourceOptions: SelectOption[];
  previewOptions: SelectOption[];
  stageOptions?: SelectOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const values = state.values ?? defaults;
  const { errors } = state;
  const control = (field: LeadFormField) => controlProps(field, values, errors);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    // Remounting per attempt makes every field, selects included, show the returned values
    // instead of React's post-action form reset.
    <form key={state.attempt} action={formAction} noValidate className="flex flex-col gap-6">
      <Section legend="Negócio">
        <Field field="name" label="Nome do negócio (obrigatório)" error={errors.name}>
          <Input {...control('name')} autoComplete="organization" />
        </Field>
        <Field field="website" label="Site" error={errors.website}>
          <Input {...control('website')} inputMode="url" placeholder="exemplo.com.br" />
        </Field>
      </Section>

      <Section legend="Origem">
        <Field field="source" label="Onde encontrei" error={errors.source}>
          <NativeSelect {...control('source')}>
            <Options options={sourceOptions} />
          </NativeSelect>
        </Field>
        <Field field="sourceUrl" label="Link de onde encontrei" error={errors.sourceUrl}>
          <Input {...control('sourceUrl')} inputMode="url" />
        </Field>
      </Section>

      <Section legend="Contato">
        <Field field="whatsapp" label="WhatsApp" error={errors.whatsapp}>
          <Input {...control('whatsapp')} type="tel" placeholder="(11) 91234-5678" />
        </Field>
        <Field field="email" label="E-mail" error={errors.email}>
          <Input {...control('email')} type="email" />
        </Field>
        <Field field="phone" label="Telefone" error={errors.phone}>
          <Input {...control('phone')} type="tel" />
        </Field>
        <Field field="instagram" label="Instagram (@ ou link)" error={errors.instagram}>
          <Input {...control('instagram')} />
        </Field>
      </Section>

      <Section legend="Prévia">
        <Field field="previewSlug" label="Prévia do Blob" error={errors.previewSlug}>
          <NativeSelect {...control('previewSlug')}>
            <Options options={previewOptions} />
          </NativeSelect>
        </Field>
      </Section>

      <Section legend="Próximo passo">
        <Field field="nextStep" label="O que fazer" error={errors.nextStep}>
          <Input {...control('nextStep')} />
        </Field>
        <Field field="dueDate" label="Até quando" error={errors.dueDate}>
          <Input {...control('dueDate')} type="date" />
        </Field>
      </Section>

      <Section legend="Notas">
        <Field field="notes" label="Anotações" error={errors.notes} className="sm:col-span-2">
          <Textarea {...control('notes')} rows={4} />
        </Field>
      </Section>

      {stageOptions && (
        <Section legend="Etapa">
          <Field field="stage" label="Etapa inicial" error={errors.stage}>
            <NativeSelect {...control('stage')}>
              <Options options={stageOptions} />
            </NativeSelect>
          </Field>
        </Section>
      )}

      {hasErrors && (
        <p role="alert" className="text-sm font-medium text-destructive">
          Revise os campos marcados.
        </p>
      )}
      {state.message && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
