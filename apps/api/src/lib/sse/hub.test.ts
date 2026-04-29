import { afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { sseHub, type SseEvent } from './hub.js';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  sseHub.__reset();
});

const ev = (id: string, data: unknown, event = 'tick'): SseEvent => ({ id, event, data });

describe('SSE hub', () => {
  it('publishes events to all live subscribers in order', async () => {
    const seenA: SseEvent[] = [];
    const seenB: SseEvent[] = [];
    sseHub.subscribe('cycle:1', (e) => seenA.push(e));
    sseHub.subscribe('cycle:1', (e) => seenB.push(e));

    await sseHub.publish('cycle:1', ev('1', { v: 1 }));
    await sseHub.publish('cycle:1', ev('2', { v: 2 }));

    expect(seenA.map((e) => e.id)).toEqual(['1', '2']);
    expect(seenB.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('replays buffered events from Last-Event-ID', async () => {
    await sseHub.publish('cycle:2', ev('1', 'a'));
    await sseHub.publish('cycle:2', ev('2', 'b'));
    await sseHub.publish('cycle:2', ev('3', 'c'));

    const seen: SseEvent[] = [];
    sseHub.subscribe('cycle:2', (e) => seen.push(e), '1');
    expect(seen.map((e) => e.id)).toEqual(['2', '3']);
  });

  it('caps the ring buffer at 200', async () => {
    for (let i = 0; i < 250; i += 1) {
      await sseHub.publish('cycle:3', ev(`e${i}`, i));
    }
    const seen: SseEvent[] = [];
    sseHub.subscribe('cycle:3', (e) => seen.push(e), 'e0');
    expect(seen.length).toBeLessThanOrEqual(200);
    expect(seen[seen.length - 1]!.id).toBe('e249');
  });

  it('isolates events between keys', async () => {
    const sa = vi.fn();
    const sb = vi.fn();
    sseHub.subscribe('cycle:a', sa);
    sseHub.subscribe('cycle:b', sb);

    await sseHub.publish('cycle:a', ev('1', 'A'));
    await sseHub.publish('cycle:b', ev('2', 'B'));

    expect(sa).toHaveBeenCalledTimes(1);
    expect(sb).toHaveBeenCalledTimes(1);
  });
});
