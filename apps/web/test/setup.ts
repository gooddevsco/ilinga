import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom doesn't ship EventSource; pages with SSE features (AgentStream,
// RenderProgress, PresenceDots) instantiate one on mount. Stub a no-op
// implementation so tests can render those views.
class StubEventSource {
  url: string;
  readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  constructor(url: string) {
    this.url = url;
  }
  addEventListener(): void {}
  removeEventListener(): void {}
  close(): void {
    this.readyState = 2;
  }
}
if (typeof globalThis.EventSource === 'undefined') {
  (globalThis as unknown as { EventSource: typeof StubEventSource }).EventSource = StubEventSource;
}
