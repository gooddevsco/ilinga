import { Hono } from 'hono';
import type { Context } from 'hono';

/** Phase 2 stubs return 501 with a structured error so the SDK can detect them. */
export const stubRouter = (name: string): Hono => {
  const r = new Hono();
  const stub = (c: Context) =>
    c.json(
      {
        type: 'https://ilinga.com/errors/not-implemented',
        title: `${name} endpoints are landing in a later phase.`,
        status: 501,
        detail: `Route: ${c.req.method} ${new URL(c.req.url).pathname}`,
      },
      501,
      { 'Content-Type': 'application/problem+json' },
    );
  r.all('*', stub);
  return r;
};
