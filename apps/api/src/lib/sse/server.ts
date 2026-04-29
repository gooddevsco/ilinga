import type { Context } from 'hono';
import { stream } from 'hono/streaming';
import { sseHub, type SseEvent } from './hub.js';

const KEEPALIVE_MS = 25_000;

export const sseRespond = (c: Context, key: string): Response => {
  const sinceId = c.req.header('Last-Event-ID') ?? undefined;
  return stream(
    c,
    async (s) => {
      s.onAbort(() => undefined);
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache, no-transform');
      c.header('Connection', 'keep-alive');
      c.header('X-Accel-Buffering', 'no');

      const writeEvent = async (ev: SseEvent): Promise<void> => {
        await s.writeln(`id: ${ev.id}`);
        await s.writeln(`event: ${ev.event}`);
        await s.writeln(`data: ${JSON.stringify(ev.data)}`);
        await s.writeln('');
      };

      const unsubscribe = sseHub.subscribe(
        key,
        (ev) => {
          void writeEvent(ev);
        },
        sinceId,
      );

      await s.writeln(`: hello\n`);

      const ka = setInterval(() => {
        void s.writeln(`event: keepalive\ndata: ${Date.now()}\n\n`);
      }, KEEPALIVE_MS);

      await new Promise<void>((resolve) => {
        s.onAbort(() => {
          clearInterval(ka);
          unsubscribe();
          resolve();
        });
      });
    },
    async (err) => {
      // eslint-disable-next-line no-console
      console.error('sse stream error', err);
    },
  );
};
