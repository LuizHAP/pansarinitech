import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { moveLead } from '@/lib/admin/lead-actions';
import {
  type Lead,
  type LeadPreviewStatus,
  PREVIEW_STATUS_LABELS,
  SOURCE_LABELS,
  STAGE_OPTIONS,
  formatDueDate,
  instagramHref,
  isOverdue,
  mailtoHref,
  previewStatus,
  telHref,
  whatsappHref,
} from '@/lib/admin/leads';
import { previewUrl } from '@/lib/admin/view';
import type { PreviewIndex } from '@/lib/client-preview-source';
import { cn } from '@/lib/utils';

export type LeadPreview = { url: string; status: LeadPreviewStatus };

const STATUS_VARIANTS: Record<LeadPreviewStatus, 'secondary' | 'outline' | 'destructive'> = {
  active: 'secondary',
  disabled: 'outline',
  missing: 'destructive',
  unknown: 'outline',
};

const LINK_CLASS = 'font-medium underline underline-offset-4 hover:text-muted-foreground';

type ContactLink = { label: string; href: string; external: boolean };

function contactLinks(lead: Lead): ContactLink[] {
  const links: ContactLink[] = [];
  if (lead.whatsapp) {
    links.push({ label: 'WhatsApp', href: whatsappHref(lead.whatsapp), external: true });
  }
  if (lead.email) links.push({ label: 'E-mail', href: mailtoHref(lead.email), external: false });
  if (lead.phone) links.push({ label: 'Telefone', href: telHref(lead.phone), external: false });
  if (lead.instagram) {
    links.push({ label: 'Instagram', href: instagramHref(lead.instagram), external: true });
  }
  if (lead.website) links.push({ label: 'Site', href: lead.website, external: true });
  if (lead.sourceUrl) links.push({ label: 'Origem', href: lead.sourceUrl, external: true });
  return links;
}

export function leadPreview(index: PreviewIndex, lead: Lead): LeadPreview | null {
  if (!lead.previewSlug) return null;
  return { url: previewUrl(lead.previewSlug), status: previewStatus(index, lead.previewSlug) };
}

export function LeadLinks({
  lead,
  preview,
  emptyText,
}: {
  lead: Lead;
  preview: LeadPreview | null;
  emptyText?: string;
}) {
  const links = contactLinks(lead);
  if (links.length === 0 && !preview) {
    return emptyText ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null;
  }

  return (
    <div className="flex flex-col gap-2">
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className={LINK_CLASS}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {preview && (
        <div className="flex flex-wrap items-center gap-2">
          <a href={preview.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Abrir prévia
          </a>
          <Badge variant={STATUS_VARIANTS[preview.status]}>
            {PREVIEW_STATUS_LABELS[preview.status]}
          </Badge>
        </div>
      )}
    </div>
  );
}

export function StageForm({ lead }: { lead: Lead }) {
  const id = `stage-${lead.id}`;
  return (
    <form action={moveLead.bind(null, lead.id)} className="flex items-end gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={id} className="text-xs text-muted-foreground">
          Etapa
        </label>
        <NativeSelect id={id} name="stage" defaultValue={lead.stage}>
          {STAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" size="sm" variant="outline" className="h-8">
        Mover
      </Button>
    </form>
  );
}

export function LeadCard({
  lead,
  today,
  preview,
}: {
  lead: Lead;
  today: string;
  preview: LeadPreview | null;
}) {
  const overdue = isOverdue(lead.dueDate, today);

  return (
    <Card
      size="sm"
      data-overdue={overdue || undefined}
      className={cn(overdue && 'ring-2 ring-destructive')}
    >
      <CardHeader className="flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 text-sm font-semibold break-words">
          <a href={`/admin/leads/${lead.id}`} className="underline-offset-4 hover:underline">
            {lead.name}
          </a>
        </h3>
        <Badge variant="secondary">{SOURCE_LABELS[lead.source]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(lead.nextStep || lead.dueDate) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 break-words">
            {lead.nextStep && (
              <p className="min-w-0">
                <span className="text-muted-foreground">Próximo passo:</span> {lead.nextStep}
              </p>
            )}
            {lead.dueDate && (
              <p className="text-muted-foreground">Até {formatDueDate(lead.dueDate)}</p>
            )}
            {overdue && <Badge variant="destructive">Atrasado</Badge>}
          </div>
        )}
        <LeadLinks lead={lead} preview={preview} />
        <StageForm lead={lead} />
      </CardContent>
    </Card>
  );
}
