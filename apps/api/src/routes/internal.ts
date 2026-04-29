import { Hono } from 'hono';
import { config } from '../config.js';

export const healthRoutes = new Hono();

healthRoutes.get('/healthz', (c) =>
  c.json({ ok: true, service: 'ilinga-api', region: config().IL_REGION }),
);

healthRoutes.get('/readyz', (c) => c.json({ ok: true }));

healthRoutes.get('/version', (c) =>
  c.json({ version: process.env.npm_package_version ?? '0.0.0' }),
);

healthRoutes.get('/maintenance', (c) => {
  const banner = config().IL_MAINTENANCE_BANNER;
  return c.json({ active: banner.length > 0, message: banner });
});

healthRoutes.get('/tls-allowed', (c) => {
  const host = c.req.query('domain');
  return c.json({ allowed: Boolean(host) });
});
