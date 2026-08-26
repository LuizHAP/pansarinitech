import { cn } from '@/lib/utils';

interface TerminalLine {
  prompt?: string | null;
  command?: string | null;
  output?: string | null;
}

interface TerminalProps {
  lines: TerminalLine[];
  className?: string;
}

export function Terminal({ lines, className }: TerminalProps) {
  return (
    <div
      className={cn(
        'font-mono text-sm bg-card border border-border rounded-lg overflow-hidden',
        className,
      )}
      role="img"
      aria-label="Terminal session showing recent git activity"
    >
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted">
        <span className="size-3 rounded-full bg-red-500/60" aria-hidden="true" />
        <span className="size-3 rounded-full bg-yellow-500/60" aria-hidden="true" />
        <span className="size-3 rounded-full bg-green-500/60" aria-hidden="true" />
      </div>
      <div className="p-4 overflow-y-auto" style={{ fontFamily: 'var(--font-mono)' }}>
        <pre className="m-0 text-[13px] leading-relaxed">
          <code>
            {lines.map((line, i) => {
              const key = line.command
                ? `cmd-${line.command}`
                : line.output
                  ? `out-${line.output.slice(0, 20)}`
                  : `prompt-${line.prompt}-${i}`;
              return (
                <span key={key} className="block">
                  {line.prompt && (
                    <>
                      <span className="text-green-600 dark:text-green-400">{line.prompt}</span>
                      <span className="text-muted-foreground"> $ </span>
                    </>
                  )}
                  {line.command && (
                    <span className="text-cyan-600 dark:text-cyan-400">{line.command}</span>
                  )}
                  {line.output && (
                    <>
                      {line.prompt || line.command ? (
                        <span className="text-muted-foreground"> → </span>
                      ) : null}
                      <span className="text-gray-700 dark:text-gray-300">{line.output}</span>
                    </>
                  )}
                  <br />
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
