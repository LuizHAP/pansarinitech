'use client';

// src/components/mdx/pre-with-copy-button.tsx — Phase 4 D-09, D-10
//
// Client island wrapping rehype-pretty-code's <pre> output. Reuses the Phase 2
// secure-context fallback pattern from copy-email-button.tsx (CONTACT-03).
//
// Tap-target invariant: button effective hit area is ≥ 48×48 (Lighthouse SEO
// tap-targets / RESEARCH §14 / Pitfall #8) via min-w-12 min-h-12 +
// inline-flex centering — the visible icon stays small but the focus/click
// area is full size.
//
// PERF-04: this island carries no shiki/prism imports — the highlighted DOM
// is computed at build time by rehype-pretty-code; the button only walks the
// already-rendered React tree to extract text.
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, isValidElement, useState } from 'react';
import { toast } from 'sonner';

function extractCodeText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractCodeText).join('');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; 'data-line'?: unknown };
    const inner = extractCodeText(props.children);
    if ('data-line' in props) return `${inner}\n`;
    return inner;
  }
  return '';
}

export function PreWithCopyButton(props: React.HTMLAttributes<HTMLPreElement>) {
  const { children, className, ...rest } = props;
  const t = useTranslations('mdx.copyCode');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = extractCodeText(children).replace(/\n+$/, '');
    let success = false;
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }
    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
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
      setCopied(true);
      toast.success(t('success'));
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('error'));
    }
  };

  return (
    <div className="group relative">
      {/* aria-live region announces copy event for screen readers (BLOG-02).
          <output> has implicit role="status" + polite live region per ARIA. */}
      <output aria-live="polite" className="sr-only">
        {copied ? t('success') : ''}
      </output>
      <pre {...rest} className={`${className ?? ''} relative`}>
        {children}
      </pre>
      {/* min-w-12 min-h-12 = 48×48 effective hit area (Lighthouse SEO tap-targets) */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t('button')}
        className="absolute right-2 top-2 inline-flex min-h-12 min-w-12 items-center justify-center rounded-md border border-border bg-background/80 opacity-0 backdrop-blur transition focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <CheckIcon className="size-4" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
