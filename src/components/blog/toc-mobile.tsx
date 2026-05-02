// src/components/blog/toc-mobile.tsx — Phase 4 D-07, D-08
// Mobile collapsed TOC using native <details> disclosure (zero JS, intrinsic
// width — does not break iPhone SE 375px layout). Server component.
import type { TocEntry } from '@/lib/mdx/toc';

export function TocMobile({ entries, label }: { entries: TocEntry[]; label: string }) {
  if (entries.length === 0) return null;
  return (
    <details className="my-6 rounded-md border border-border p-3 lg:hidden">
      <summary className="cursor-pointer text-sm font-semibold">{label}</summary>
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
    </details>
  );
}
