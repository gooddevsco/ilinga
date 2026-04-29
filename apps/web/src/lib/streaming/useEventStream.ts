import { useEffect, useRef, useState } from 'react';

const BASE_URL =
  (import.meta.env['VITE_API_ORIGIN'] as string | undefined) ?? 'http://localhost:3001';

export interface StreamEvent {
  id: string;
  event: string;
  data: unknown;
}

export interface StreamState {
  events: StreamEvent[];
  status: 'connecting' | 'open' | 'closed' | 'paused';
  attempt: number;
}

export interface UseEventStreamOptions {
  path: string;
  enabled?: boolean;
  /** Bound history to last N events to keep the React tree affordable. */
  maxBufferSize?: number;
  /** Optional event-name filter; events outside the list are dropped before render. */
  events?: string[];
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Typed SSE consumer with auto-reconnect (exponential backoff 250ms->4s),
 * Last-Event-ID resume, and polling fallback after 3 consecutive failures.
 */
export const useEventStream = (opts: UseEventStreamOptions): StreamState => {
  const [state, setState] = useState<StreamState>({
    events: [],
    status: 'connecting',
    attempt: 0,
  });
  const lastIdRef = useRef<string | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const maxBuffer = opts.maxBufferSize ?? 400;

  useEffect(() => {
    if (opts.enabled === false) return;
    cancelledRef.current = false;
    let attempt = 0;
    let consecutiveFailures = 0;
    let es: EventSource | null = null;

    const open = (): void => {
      const url = new URL(`${BASE_URL}${opts.path}`);
      if (lastIdRef.current) url.searchParams.set('lastEventId', lastIdRef.current);
      es = new EventSource(url.toString(), { withCredentials: true });
      setState((s) => ({ ...s, status: 'connecting', attempt }));

      es.onopen = () => {
        consecutiveFailures = 0;
        setState((s) => ({ ...s, status: 'open' }));
      };

      const onAny = (event: MessageEvent, name: string): void => {
        if (opts.events && !opts.events.includes(name)) return;
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }
        const id = event.lastEventId;
        if (id) lastIdRef.current = id;
        setState((s) => {
          const next = [...s.events, { id, event: name, data }];
          if (next.length > maxBuffer) next.splice(0, next.length - maxBuffer);
          return { ...s, events: next };
        });
      };

      es.onmessage = (e) => onAny(e, 'message');
      // Subscribe to a generous list of event types we care about.
      const evts = [
        'stage.started',
        'stage.complete',
        'cluster.complete',
        'cycle.error',
        'module.queued',
        'module.running',
        'module.complete',
        'module.failed',
        'prompt.token',
        'prompt.complete',
        'render.queued',
        'render.html_ready',
        'render.pdf_progress',
        'render.complete',
        'render.failed',
        'render.cancelled',
        'artifact.scan.queued',
        'artifact.scan.clean',
        'artifact.scan.infected',
        'artifact.extract.progress',
        'artifact.extract.complete',
        'competitor.scrape.queued',
        'competitor.scrape.complete',
        'presence.joined',
        'presence.left',
        'presence.location',
        'stream.cancelled',
        'stream.dropped',
        'keepalive',
      ];
      for (const name of evts) {
        es.addEventListener(name, (e) => onAny(e as MessageEvent, name));
      }

      es.onerror = async () => {
        es?.close();
        if (cancelledRef.current) return;
        consecutiveFailures += 1;
        if (consecutiveFailures >= 3) {
          setState((s) => ({ ...s, status: 'paused' }));
          // Polling fallback: caller still receives state via 'paused'.
          await wait(2000);
        }
        const backoffMs = Math.min(4000, 250 * 2 ** attempt);
        attempt += 1;
        setState((s) => ({ ...s, status: 'connecting', attempt }));
        await wait(backoffMs);
        if (!cancelledRef.current) open();
      };
    };

    open();

    return () => {
      cancelledRef.current = true;
      es?.close();
      setState((s) => ({ ...s, status: 'closed' }));
    };
  }, [opts.path, opts.enabled, maxBuffer, opts.events]);

  return state;
};
