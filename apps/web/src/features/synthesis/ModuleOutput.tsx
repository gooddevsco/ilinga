import { useMemo } from 'react';
import { useEventStream } from '../../lib/streaming/useEventStream';

/** Reconstructs a module's narrative from streamed prompt.token deltas. */
export const ModuleOutput = ({
  cycleId,
  moduleId,
  label,
}: {
  cycleId: string;
  moduleId: string;
  label: string;
}): JSX.Element => {
  const { events, status } = useEventStream({
    path: `/v1/cycles/${cycleId}/modules/${moduleId}/events`,
  });

  const text = useMemo(() => {
    let acc = '';
    for (const e of events) {
      if (e.event === 'prompt.token') {
        const d = e.data as { delta?: string; runId?: string };
        if (typeof d.delta === 'string') acc += d.delta;
      } else if (e.event === 'module.failed') {
        const d = e.data as { reason?: string };
        return acc + `\n\n— failed: ${d.reason ?? 'unknown error'}`;
      }
    }
    return acc;
  }, [events]);

  const done = events.some((e) => e.event === 'module.complete');

  return (
    <div className="rounded-lg border border-[color:var(--color-border)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span
          aria-live="polite"
          className="text-xs text-[color:var(--color-fg-muted)]"
        >
          {done ? 'Saved' : status === 'open' ? 'Streaming…' : status}
        </span>
      </header>
      <pre className="whitespace-pre-wrap px-4 py-3 text-sm leading-6">{text || '…'}</pre>
    </div>
  );
};
