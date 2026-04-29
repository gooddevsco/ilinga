import { EventEmitter } from 'node:events';
import { getPubSub } from '../redis.js';

export interface SseEvent {
  id: string;
  event: string;
  data: unknown;
}

const RING_SIZE = 200;

class Hub {
  private readonly local = new EventEmitter();
  private readonly buffers = new Map<string, SseEvent[]>();
  private subscribed = false;

  ensureRedisSubscribed(): void {
    if (this.subscribed) return;
    if (process.env.NODE_ENV === 'test') {
      this.subscribed = true;
      return;
    }
    const { sub } = getPubSub();
    void sub.psubscribe('il-sse:*');
    sub.on('pmessage', (_pattern, channel, raw) => {
      const key = channel.slice('il-sse:'.length);
      try {
        const ev = JSON.parse(raw) as SseEvent;
        this.appendToBuffer(key, ev);
        this.local.emit(`l:${key}`, ev);
      } catch {
        // ignore malformed publish
      }
    });
    this.subscribed = true;
  }

  private appendToBuffer(key: string, ev: SseEvent): void {
    const buf = this.buffers.get(key) ?? [];
    buf.push(ev);
    if (buf.length > RING_SIZE) buf.splice(0, buf.length - RING_SIZE);
    this.buffers.set(key, buf);
  }

  async publish(key: string, ev: SseEvent): Promise<void> {
    this.appendToBuffer(key, ev);
    this.local.emit(`l:${key}`, ev);
    if (process.env.NODE_ENV !== 'test') {
      const { pub } = getPubSub();
      await pub.publish(`il-sse:${key}`, JSON.stringify(ev));
    }
  }

  subscribe(
    key: string,
    handler: (ev: SseEvent) => void,
    sinceId?: string,
  ): () => void {
    this.ensureRedisSubscribed();
    const buf = this.buffers.get(key);
    if (buf) {
      const startIdx = sinceId ? buf.findIndex((e) => e.id === sinceId) : -1;
      const replay = startIdx >= 0 ? buf.slice(startIdx + 1) : [];
      for (const e of replay) handler(e);
    }
    const channel = `l:${key}`;
    this.local.on(channel, handler);
    return () => this.local.off(channel, handler);
  }

  /** test-only — flush all internal state. */
  __reset(): void {
    this.local.removeAllListeners();
    this.buffers.clear();
    this.subscribed = false;
  }
}

export const sseHub = new Hub();
