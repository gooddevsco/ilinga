/**
 * Regression test for the presence-endpoint spam:
 * useEventStream must not re-open its EventSource when the `events` filter
 * array reference changes but the path/enabled/maxBuffer stay identical.
 * Without this guard, every parent re-render would tear down the SSE
 * connection and immediately re-open it (and `usePresenceBeacon`'s cleanup
 * would fire a POST `presence/beacon` `intent:'leave'` per cycle).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useEventStream } from './useEventStream.js';

let opens = 0;
let closes = 0;

class CountingEventSource {
  url: string;
  readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    opens += 1;
  }
  addEventListener(): void {}
  removeEventListener(): void {}
  close(): void {
    closes += 1;
    this.readyState = 2;
  }
}

const Probe = ({ events }: { events: string[] }): null => {
  useEventStream({ path: '/v1/cycles/c1/presence', events });
  return null;
};

describe('useEventStream', () => {
  beforeEach(() => {
    opens = 0;
    closes = 0;
    (globalThis as unknown as { EventSource: typeof CountingEventSource }).EventSource =
      CountingEventSource;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens exactly one EventSource for a given path even if the events array reference changes', () => {
    const { rerender } = render(<Probe events={['presence.joined']} />);
    expect(opens).toBe(1);

    // Re-render with a NEW array reference but the same content. Without the
    // ref-based guard this would close + reopen.
    act(() => {
      rerender(<Probe events={['presence.joined']} />);
    });
    expect(opens).toBe(1);
    expect(closes).toBe(0);

    // Even if the filter contents change, the connection should stay up —
    // filtering happens at event-arrival time via the ref.
    act(() => {
      rerender(<Probe events={['presence.left', 'presence.location']} />);
    });
    expect(opens).toBe(1);
    expect(closes).toBe(0);
  });

  it('closes the EventSource on unmount', () => {
    const { unmount } = render(<Probe events={['presence.joined']} />);
    unmount();
    expect(closes).toBe(1);
  });
});
