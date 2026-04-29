import { Hono } from 'hono';
import { sseRespond } from '../lib/sse/server.js';

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

cycleRoutes.all('*', (c) =>
  c.json(
    {
      type: 'https://ilinga.com/errors/not-implemented',
      title: 'cycle CRUD endpoints land in Phase 6+',
      status: 501,
    },
    501,
    { 'Content-Type': 'application/problem+json' },
  ),
);
