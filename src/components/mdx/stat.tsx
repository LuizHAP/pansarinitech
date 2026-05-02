// src/components/mdx/stat.tsx — Phase 3 D-07
// Pure RSC (sync) — renders a number + label pair for case-study impact figures.
// Authoring shape: <Stat number="0 → 1" label="transactional storefronts in segment" />
export function Stat({ number, label }: { number: string; label: string }) {
  return (
    <p className="my-6 flex flex-col items-start gap-1">
      <span className="text-4xl font-bold leading-none tracking-tight">{number}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </p>
  );
}
