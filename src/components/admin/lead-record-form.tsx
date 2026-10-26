'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { LeadRecordFormState } from '@/lib/admin/lead-actions';
import type {
  LeadRecordFormErrors,
  LeadRecordFormField,
  LeadRecordFormValues,
  SelectOption,
} from '@/lib/admin/leads';
import { cn } from '@/lib/utils';
import { useActionState } from 'react';

const INITIAL_STATE: LeadRecordFormState = { errors: {}, message: null, values: null, attempt: 0 };

type ControlProps = {
  id: string;
  name: LeadRecordFormField;
  defaultValue: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

// The edit LeadForm on the same page already owns the lead-* ids.
function controlProps(
  field: LeadRecordFormField,
  values: LeadRecordFormValues,
  errors: LeadRecordFormErrors,
): ControlProps {
  return {
    id: `record-${field}`,
    name: field,
    defaultValue: values[field],
    ...(errors[field] ? { 'aria-invalid': true, 'aria-describedby': `record-${field}-error` } : {}),
  };
}

function Field({
  field,
  label,
  error,
  className,
  children,
}: {
  field: LeadRecordFormField;
  label: string;
  error: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={`record-${field}`} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`record-${field}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function LeadRecordForm({
  action,
  defaults,
  kindOptions,
}: {
  action: (state: LeadRecordFormState, formData: FormData) => Promise<LeadRecordFormState>;
  defaults: LeadRecordFormValues;
  kindOptions: SelectOption[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const values = state.values ?? defaults;
  const { errors } = state;
  const control = (field: LeadRecordFormField) => controlProps(field, values, errors);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form key={state.attempt} action={formAction} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field field="kind" label="Tipo" error={errors.kind}>
          <NativeSelect {...control('kind')}>
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field field="date" label="Data" error={errors.date}>
          <Input {...control('date')} type="date" />
        </Field>
      </div>
      <Field field="title" label="Título" error={errors.title}>
        <Input {...control('title')} />
      </Field>
      <Field field="link" label="Link (opcional)" error={errors.link}>
        <Input {...control('link')} inputMode="url" placeholder="exemplo.com.br" />
      </Field>
      <Field field="body" label="Texto" error={errors.body}>
        <Textarea {...control('body')} rows={12} />
      </Field>

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
        Adicionar registro
      </Button>
    </form>
  );
}
