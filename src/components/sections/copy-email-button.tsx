'use client';

// src/components/sections/copy-email-button.tsx — client island
// CONTACT-03: click-to-copy email with sonner toast feedback.
//
// Strategy:
//   1. If window.isSecureContext + navigator.clipboard available → writeText() + success toast.
//   2. Else (HTTP / older browser) → legacy document.execCommand('copy') via hidden textarea.
//   3. Both fail (rare) → error toast advising Cmd/Ctrl+C and select the visible email.
//
// Locale-aware toast messages come from messages/{en,pt}.json `contact.copied` /
// `contact.copyFailed`. Sonner Toaster is mounted in [locale]/layout.tsx (Wave 1).
import { CopyIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface CopyEmailButtonProps {
  email: string;
  className?: string;
}

export function CopyEmailButton({ email, className }: CopyEmailButtonProps) {
  const t = useTranslations('contact');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    let success = false;

    if (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(email);
        success = true;
      } catch {
        success = false;
      }
    }

    // Fallback for insecure contexts / older browsers.
    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      toast.success(t('copied'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('copyFailed'));
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={
        className ??
        'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
      }
    >
      <CopyIcon className="size-4" aria-hidden="true" />
      <span>{copied ? t('copied') : t('copyButton')}</span>
    </button>
  );
}
