import { useEventStream } from '../../lib/streaming/useEventStream';

export interface Stage {
  code: string;
  cluster: string;
  label: string;
}

const statusOf = (
  events: ReturnType<typeof useEventStream>['events'],
  code: string,
): 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' => {
  let status: 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' = 'queued';
  for (const e of events) {
    const data = (e.data ?? {}) as { code?: string };
    if (data.code !== code) continue;
    if (e.event === 'stage.started' || e.event === 'module.running') status = 'running';
    else if (e.event === 'stage.complete' || e.event === 'module.complete') status = 'complete';
    else if (e.event === 'module.failed') status = 'failed';
    else if (e.event === 'stream.cancelled') status = 'cancelled';
  }
  return status;
};

const toneOf = (s: ReturnType<typeof statusOf>): string =>
  s === 'complete'
    ? 'border-[color:var(--color-success)] bg-[color:var(--color-success)]/10'
    : s === 'running'
    ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] motion-safe:animate-pulse'
    : s === 'failed'
    ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10'
    : s === 'cancelled'
    ? 'border-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10'
    : 'border-[color:var(--color-border)]';

export const PipelineGraph = ({
  cycleId,
  stages,
}: {
  cycleId: string;
  stages: Stage[];
}): JSX.Element => {
  const { events } = useEventStream({ path: `/v1/cycles/${cycleId}/events` });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((s) => {
        const status = statusOf(events, s.code);
        return (
          <div
            key={s.code}
            className={`rounded-lg border p-4 transition-colors ${toneOf(status)}`}
            data-stage={s.code}
            data-status={status}
          >
            <p className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
              {s.cluster}
            </p>
            <h3 className="mt-1 text-sm font-semibold">{s.label}</h3>
            <p className="mt-2 text-xs text-[color:var(--color-fg-muted)]">{status}</p>
          </div>
        );
      })}
    </div>
  );
};
