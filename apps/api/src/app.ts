import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from './config.js';
import {
  accessLogMiddleware,
  errorBoundaryMiddleware,
  requestIdMiddleware,
  securityHeadersMiddleware,
} from './lib/middleware.js';
import { healthRoutes } from './routes/internal.js';
import { authRoutes } from './routes/auth.js';
import { tenantRoutes } from './routes/tenants.js';
import { ventureRoutes } from './routes/ventures.js';
import { cycleRoutes } from './routes/cycles.js';
import { reportRoutes } from './routes/reports.js';
import { billingRoutes } from './routes/billing.js';
import { creditRoutes } from './routes/credits.js';
import { webhookRoutes } from './routes/webhooks.js';
import { adminRoutes } from './routes/admin.js';
import { stakeholderRoutes } from './routes/stakeholders.js';
import { searchRoutes } from './routes/search.js';
import { tokenRoutes } from './routes/api-tokens.js';
import { synthesisRoutes } from './routes/synthesis.js';
import { n8nRoutes } from './routes/n8n.js';
import { statusRoutes } from './routes/status.js';
import { aiEndpointRoutes } from './routes/ai-endpoints.js';

export const buildApp = () => {
  const cfg = config();
  const app = new Hono();

  app.use('*', requestIdMiddleware);
  app.use('*', accessLogMiddleware);
  app.use('*', errorBoundaryMiddleware);
  app.use('*', securityHeadersMiddleware);
  app.use(
    '*',
    cors({
      origin: [cfg.IL_WEB_ORIGIN],
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization', 'If-Match', 'X-Il-Csrf', cfg.IL_REQUEST_ID_HEADER],
      exposeHeaders: ['ETag', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    }),
  );

  app.route('/v1/internal', healthRoutes);
  app.route('/v1/auth', authRoutes);
  app.route('/v1/tenants', tenantRoutes);
  app.route('/v1/ventures', ventureRoutes);
  app.route('/v1/cycles', cycleRoutes);
  app.route('/v1/reports', reportRoutes);
  app.route('/v1/billing', billingRoutes);
  app.route('/v1/credits', creditRoutes);
  app.route('/v1/webhooks', webhookRoutes);
  app.route('/v1/admin', adminRoutes);
  app.route('/v1/stakeholder', stakeholderRoutes);
  app.route('/v1/search', searchRoutes);
  app.route('/v1/api-tokens', tokenRoutes);
  app.route('/v1/synthesis', synthesisRoutes);
  app.route('/v1/n8n', n8nRoutes);
  app.route('/v1/status', statusRoutes);
  app.route('/v1/ai-endpoints', aiEndpointRoutes);

  app.notFound((c) =>
    c.json(
      { type: 'about:blank', title: 'Not Found', status: 404 },
      404,
      { 'Content-Type': 'application/problem+json' },
    ),
  );

  return app;
};
