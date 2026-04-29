import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/v1/internal/healthz', (c) => c.json({ ok: true, service: 'ilinga-api' }));
app.get('/v1/internal/readyz', (c) => c.json({ ok: true }));
app.get('/v1/internal/version', (c) =>
  c.json({ version: process.env.npm_package_version ?? '0.0.0' }),
);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.warn(`ilinga-api listening on http://localhost:${info.port}`);
});

export { app };
