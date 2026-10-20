import { TerminalLogo } from '@/components/site';
import { contact } from '@/data/contact';
// src/components/shared/footer.tsx — UX-05
// All target="_blank" links carry rel="noopener noreferrer" (T-02-2-06 mitigation).
import { useTranslations } from 'next-intl';

const REPO_URL = 'https://github.com/LuizHAP/pansarinitech';

const linkClass =
  'text-ink-body underline decoration-ink-line underline-offset-4 transition-colors hover:text-paper hover:decoration-signal-soft';

function Separator() {
  return <span aria-hidden="true"> · </span>;
}

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-ink-rule bg-ink">
      <div className="mx-auto box-content flex max-w-[1280px] flex-col gap-5 px-4 py-10 font-mono text-[13px] text-ink-muted md:flex-row md:items-center md:justify-between md:px-8">
        <TerminalLogo />
        <p>
          {t('copyright')}
          <Separator />
          {t('builtWith')}
        </p>
        <p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('source')}
          </a>
          <Separator />
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('githubLabel')}
            className={linkClass}
          >
            GitHub
          </a>
          <Separator />
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('linkedinLabel')}
            className={linkClass}
          >
            LinkedIn
          </a>
        </p>
      </div>
    </footer>
  );
}
