import { cn } from '@/lib/utils';
// Brand mark + wordmark for the sticky header.
// Mark sits on a near-black pad so cyan/gold/white glows keep contrast in both
// Jedi (light) and Sith (dark) themes — the source art is dark-optimized.
import Image from 'next/image';

type BrandLogoProps = {
  className?: string;
  /** When false, render mark only (decorative; parent must supply accessible name). */
  showWordmark?: boolean;
};

export function BrandLogo({ className, showWordmark = true }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md',
          // Opaque pad: logo art uses white/cyan glows that fail on light muted headers.
          'bg-[#0a0a0e] ring-1 ring-border/50',
        )}
        aria-hidden="true"
      >
        <Image
          src="/pansarini-mark.png"
          alt=""
          width={28}
          height={28}
          className="size-7 object-contain"
          priority
        />
      </span>
      {showWordmark ? (
        <span className="text-base font-semibold text-foreground">Luiz Pansarini</span>
      ) : null}
    </span>
  );
}
