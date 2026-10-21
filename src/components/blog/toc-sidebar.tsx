// src/components/blog/toc-sidebar.tsx — Phase 4 D-07, D-08
// Desktop sticky TOC. `hidden lg:block` — does not render below 1024px.
// Server component (zero JS). Active-section IntersectionObserver highlight
// is DEFERRED to Phase 5 polish per CONTEXT D-08 + RESEARCH §3 OQ#5.
import type { TocEntry } from '@/lib/mdx/toc';

export function TocSidebar({ entries, label }: { entries: TocEntry[]; label: string }) {
  if (entries.length === 0) return null;
  return (
    <nav
      aria-labelledby="toc-heading"
      className="hidden self-start border-t-2 border-foreground pt-4 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
    >
      <h2
        id="toc-heading"
        className="font-mono text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {label}
      </h2>
      <ol className="mt-4 space-y-2.5 font-mono text-[13px] leading-snug">
        {entries.map((e) => (
          <li key={e.id} className={e.level === 3 ? 'ml-4' : ''}>
            <a
              href={`#${e.id}`}
              className="text-foreground decoration-primary decoration-2 underline-offset-4 hover:text-primary hover:underline"
            >
              {e.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
