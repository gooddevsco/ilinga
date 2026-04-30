import { useMemo } from 'react';
import { useEventStream } from '../../lib/streaming/useEventStream';

interface RenderProgressProps {
  cycleId: string;
  reportId: string;
  renderId?: string;
}

export const RenderProgress = ({ cycleId, reportId }: RenderProgressProps): JSX.Element => {
  const { events, status } = useEventStream({
    path: `/v1/cycles/${cycleId}/reports/${reportId}/events`,
    events: [
      'render.queued',
      'render.html_ready',
      'render.pdf_progress',
      'render.complete',
      'render.failed',
      'render.cancelled',
    ],
  });

  const state = useMemo(() => {
    let phase: 'queued' | 'html' | 'pdf' | 'complete' | 'failed' | 'cancelled' = 'queued';
    let page = 0;
    let total = 0;
    let reason: string | undefined;
    for (const e of events) {
      if (e.event === 'render.html_ready') phase = 'html';
      if (e.event === 'render.pdf_progress') {
        phase = 'pdf';
        const d = e.data as { page?: number; total?: number };
        if (typeof d.page === 'number') page = d.page;
        if (typeof d.total === 'number') total = d.total;
      }
      if (e.event === 'render.complete') phase = 'complete';
      if (e.event === 'render.failed') {
        phase = 'failed';
        reason = (e.data as { reason?: string }).reason;
      }
      if (e.event === 'render.cancelled') phase = 'cancelled';
    }
    return { phase, page, total, reason };
  }, [events]);

  const pct =
    state.phase === 'complete'
      ? 100
      : state.phase === 'pdf' && state.total > 0
        ? Math.round((state.page / state.total) * 100)
        : state.phase === 'html'
          ? 35
          : 5;

  const tone =
    state.phase === 'complete'
      ? 'bg-[color:var(--color-success)]'
      : state.phase === 'failed'
        ? 'bg-[color:var(--color-danger)]'
        : state.phase === 'cancelled'
          ? 'bg-[color:var(--color-warning)]'
          : 'bg-[color:var(--color-accent)]';

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-[color:var(--color-border)] p-3"
    >
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>
          {state.phase === 'queued' && 'Queued'}
          {state.phase === 'html' && 'Rendering HTML'}
          {state.phase === 'pdf' && `Rendering PDF · page ${state.page}/${state.total || '?'}`}
          {state.phase === 'complete' && 'Complete'}
          {state.phase === 'failed' && (state.reason ? `Failed: ${state.reason}` : 'Failed')}
          {state.phase === 'cancelled' && 'Cancelled'}
        </span>
        <span className="text-[color:var(--color-fg-subtle)]">{status}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-accent-soft)]">
        <div className={`h-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
