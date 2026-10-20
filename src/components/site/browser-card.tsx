import { Link } from '@/lib/i18n/navigation';
import Image, { type StaticImageData } from 'next/image';

export function BrowserCard({
  href,
  url,
  title,
  meta,
  image,
  alt,
  eager,
  headingLevel: Heading = 'h3',
}: {
  href: string;
  url: string;
  title: string;
  meta?: string;
  image: StaticImageData;
  alt: string;
  eager?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-[14px] text-paper transition-transform duration-[250ms] hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="overflow-hidden rounded-[14px] border-[1.5px] border-ink-line bg-ink-card">
        <div
          aria-hidden="true"
          className="flex items-center gap-[7px] border-b-[1.5px] border-ink-line px-3.5 py-[11px]"
        >
          <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
          <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
          <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
          <span className="ml-2 truncate font-mono text-[11px] text-ink-muted">{url}</span>
        </div>
        <div className="relative aspect-video">
          <Image
            src={image}
            alt={alt}
            fill
            loading={eager ? 'eager' : 'lazy'}
            placeholder="blur"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 410px"
            className="object-cover object-top"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading className="text-2xl font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
          {title}
        </Heading>
        {meta && <p className="font-mono text-xs whitespace-nowrap text-ink-muted">{meta}</p>}
      </div>
    </Link>
  );
}
