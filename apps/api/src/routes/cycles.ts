import { Hono } from 'hono';
import { z } from 'zod';
import { ulid } from 'ulid';
import { sseRespond } from '../lib/sse/server.js';
import { sseHub } from '../lib/sse/hub.js';
import { requireAuth, requireCsrf } from '../lib/guard.js';
import { listAnswers, upsertAnswer } from '../lib/ventures/answers.js';
import { badRequest, HttpProblem } from '../lib/problem.js';

export const cycleRoutes = new Hono();

cycleRoutes.get('/:cid/events', (c) => sseRespond(c, `cycle:${c.req.param('cid')}`));
cycleRoutes.get('/:cid/modules/:mid/events', (c) =>
  sseRespond(c, `cycle:${c.req.param('cid')}:module:${c.req.param('mid')}`),
);
cycleRoutes.get('/:cid/reports/:rid/events', (c) =>
  sseRespond(c, `cycle:${c.req.param('cid')}:report:${c.req.param('rid')}`),
);
cycleRoutes.get('/:cid/artifacts/:aid/events', (c) =>
  sseRespond(c, `cycle:${c.req.param('cid')}:artifact:${c.req.param('aid')}`),
);
cycleRoutes.get('/:cid/competitors/:coid/events', (c) =>
  sseRespond(c, `cycle:${c.req.param('cid')}:competitor:${c.req.param('coid')}`),
);
cycleRoutes.get('/:cid/presence', (c) => sseRespond(c, `cycle:${c.req.param('cid')}:presence`));

cycleRoutes.use('/:cid/answers/*', requireAuth);
cycleRoutes.use('/:cid/answers/*', requireCsrf);
cycleRoutes.use('/:cid/presence/beacon', requireAuth);
cycleRoutes.use('/:cid/presence/beacon', requireCsrf);

const PresenceBody = z.object({
  location: z.string().min(1).max(120).optional(),
  /** 'leave' to broadcast a presence.left immediately on tab close. */
  intent: z.enum(['heartbeat', 'leave']).default('heartbeat'),
});

cycleRoutes.post('/:cid/presence/beacon', async (c) => {
  const body = PresenceBody.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const cycleId = c.req.param('cid');
  const userId = c.get('userId') as string;
  await sseHub.publish(`cycle:${cycleId}:presence`, {
    id: ulid(),
    event: body.data.intent === 'leave' ? 'presence.left' : 'presence.location',
    data: { userId, location: body.data.location ?? null },
  });
  return c.json({ ok: true });
});

cycleRoutes.get('/:cid/answers', async (c) => {
  const tenantId = c.req.header('x-il-tenant-id');
  if (!tenantId) throw badRequest('missing X-Il-Tenant-Id');
  const answers = await listAnswers(tenantId, c.req.param('cid'));
  return c.json({ answers });
});

const UpsertBody = z.object({
  questionId: z.string().uuid(),
  rawValue: z.unknown(),
});

cycleRoutes.put('/:cid/answers', async (c) => {
  const tenantId = c.req.header('x-il-tenant-id');
  if (!tenantId) throw badRequest('missing X-Il-Tenant-Id');
  const body = UpsertBody.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const ifMatch = c.req.header('if-match');
  const ver = ifMatch === undefined ? null : Number.parseInt(ifMatch, 10);
  if (ifMatch !== undefined && Number.isNaN(ver)) throw badRequest('invalid If-Match');

  try {
    const result = await upsertAnswer(
      tenantId,
      c.req.param('cid'),
      body.data.questionId,
      c.get('userId') as string,
      body.data.rawValue,
      ifMatch === undefined ? null : (ver as number),
    );
    return c.json(result, 200, { ETag: String(result.version) });
  } catch (err) {
    if (err instanceof HttpProblem) throw err;
    throw err;
  }
});
