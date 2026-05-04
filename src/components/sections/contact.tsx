import { contact } from '@/data/contact';
import type { Locale } from '@/i18n/routing';
import { pickLocale } from '@/lib/i18n/helpers';
// src/components/sections/contact.tsx — RSC
// CONTACT-01 (mailto with locale-aware subject), CONTACT-02 (LinkedIn + GitHub),
// CONTACT-03 (click-to-copy via CopyEmailButton client island), CONTACT-04 (Resume PDF
// with download attribute).
//
// id="contact" is the anchor target the Hero "Contact" CTA scrolls to.
//
// All target="_blank" links carry rel="noopener noreferrer" (T-02-2-06 mitigation).
// mailto subject is encodeURIComponent-wrapped so non-ASCII PT subjects survive
// the URL transit (T-02-2-03 mitigation).
//
// Brand icons (GitHub / LinkedIn) are inline SVG paths because lucide-react v1.14
// does not ship brand marks. Inline SVG is tree-shake-free and zero-dependency.
import { RevealGroup, RevealItem } from '@/components/ui';
import { DownloadIcon, MailIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CopyEmailButton } from './copy-email-button';

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12.02c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-.99-.02-1.94-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18A10.96 10.96 0 0 1 12 6.84c.97 0 1.95.13 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.66.79.55C20.21 21.4 23.5 17.1 23.5 12.02 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function LinkedinMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0Z" />
    </svg>
  );
}

export function Contact() {
  const locale = useLocale() as Locale;
  const t = useTranslations('contact');
  const subject = encodeURIComponent(pickLocale(contact.mailtoSubject, locale));
  const mailtoHref = `mailto:${contact.email}?subject=${subject}`;
  const resumeHref = pickLocale(contact.resumePdf, locale);
  const resumeFile = resumeHref.split('/').pop() ?? 'resume.pdf';

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="mx-auto max-w-3xl scroll-mt-16 px-4 py-12"
    >
      <h2 id="contact-heading" className="text-2xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <p className="mt-2 text-base text-muted-foreground">{t('lead')}</p>

      <RevealGroup className="mt-6 flex flex-wrap items-center gap-3" stagger={0.05}>
        <RevealItem key="mail">
          <a
            href={mailtoHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <MailIcon className="size-4" aria-hidden="true" />
            <span className="font-mono">{contact.email}</span>
          </a>
        </RevealItem>

        <RevealItem key="copy">
          <CopyEmailButton email={contact.email} />
        </RevealItem>

        <RevealItem key="linkedin">
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('linkedinLabel')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <LinkedinMark className="size-4" />
            <span>{t('linkedinText')}</span>
          </a>
        </RevealItem>

        <RevealItem key="github">
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('githubLabel')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <GithubMark className="size-4" />
            <span>{t('githubText')}</span>
          </a>
        </RevealItem>

        <RevealItem key="resume">
          <a
            href={resumeHref}
            download={resumeFile}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <DownloadIcon className="size-4" aria-hidden="true" />
            <span>{t('resumeButton')}</span>
          </a>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
