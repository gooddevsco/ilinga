import { useEffect, useRef } from 'react';
import { useEventStream } from '../../lib/streaming/useEventStream';

const fmtTime = (): string => new Date().toLocaleTimeString('en-GB');

const eventTone = (event: string): string => {
  if (event.startsWith('module.failed') || event === 'cycle.error') return 'text-[color:var(--color-danger)]';
  if (event.startsWith('module.complete') || event === 'render.complete') return 'text-[color:var(--color-success)]';
  if (event === 'stream.cancelled') return 'text-[color:var(--color-warning)]';
  return 'text-[color:var(--color-fg-muted)]';
};

export const AgentStream = ({ cycleId }: { cycleId: string }): JSX.Element => {
  const { events, status, attempt } = useEventStream({
    path: `/v1/cycles/${cycleId}/events`,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-2 text-xs text-[color:var(--color-fg-muted)]">
        <span>Agent stream</span>
        <span aria-live="polite">
          {status === 'open' && 'Live'}
          {status === 'connecting' && `Reconnecting (attempt ${attempt})`}
          {status === 'paused' && 'Live updates paused — falling back to polling'}
          {status === 'closed' && 'Disconnected'}
        </span>
      </header>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Agent activity"
        className="flex-1 overflow-auto px-4 py-2 font-mono text-xs"
      >
        {events.length === 0 ? (
          <p className="text-[color:var(--color-fg-subtle)]">Waiting for first event…</p>
        ) : (
          events
            .filter((e) => e.event !== 'keepalive')
            .map((e) => (
              <div key={e.id} className={`mb-1 ${eventTone(e.event)}`}>
                <span className="mr-2 text-[color:var(--color-fg-subtle)]">{fmtTime()}</span>
                <span className="font-semibold">{e.event}</span>{' '}
                <span>{typeof e.data === 'string' ? e.data : JSON.stringify(e.data)}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
