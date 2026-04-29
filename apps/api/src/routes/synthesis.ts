import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { buildSystemRegistry } from '../lib/ai/registry.js';
import { cancelCycle, startCycleSynthesis } from '../lib/synthesis/pipeline.js';
import { badRequest } from '../lib/problem.js';

export const synthesisRoutes = new Hono();
synthesisRoutes.use('*', requireAuth);
synthesisRoutes.use('*', requireCsrf);

const Start = z.object({ briefText: z.string().min(20).max(20_000) });

synthesisRoutes.post(
  '/tenant/:tid/cycles/:cid/start',
  requireTenantMembership('tid'),
  async (c) => {
    const body = Start.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const registry = buildSystemRegistry();
    const pick = registry.pick('narrative');
    if (!pick) {
      return c.json(
        {
          type: 'about:blank',
          title: 'No AI provider configured',
          status: 503,
          detail: 'Set IL_SYSTEM_OPENAI_KEY or add a tenant AI endpoint.',
        },
        503,
      );
    }
    void startCycleSynthesis(
      c.req.param('tid'),
      c.req.param('cid'),
      body.data.briefText,
      pick.provider,
      pick.model,
    );
    return c.json({ ok: true, started: true });
  },
);

synthesisRoutes.post(
  '/tenant/:tid/cycles/:cid/cancel',
  requireTenantMembership('tid'),
  async (c) => {
    await cancelCycle(c.req.param('cid'));
    return c.json({ ok: true });
  },
);
