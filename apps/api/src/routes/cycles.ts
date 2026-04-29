import { Hono } from 'hono';
import { z } from 'zod';
import { sseRespond } from '../lib/sse/server.js';
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
