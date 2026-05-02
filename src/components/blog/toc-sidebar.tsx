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
      className="hidden self-start lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      <h2
        id="toc-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </h2>
      <ol className="mt-3 space-y-2 text-sm">
        {entries.map((e) => (
          <li key={e.id} className={e.level === 3 ? 'ml-4' : ''}>
            <a
              href={`#${e.id}`}
              className="text-foreground decoration-primary decoration-2 underline-offset-4 hover:underline"
            >
              {e.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
