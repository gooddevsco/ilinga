import { Hono } from 'hono';
import { z } from 'zod';
import { renderMagicLinkEmail } from '@ilinga/emails';
import { rateLimit } from '../lib/rate-limit.js';
import {
  inviteStakeholder,
  optOutStakeholder,
  resolveStakeholderToken,
  stakeholderUrl,
  submitStakeholderResponse,
} from '../lib/ventures/stakeholders.js';
import { sendTracked } from '../lib/mailer.js';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { badRequest, notFound } from '../lib/problem.js';

export const stakeholderRoutes = new Hono();

const Invite = z.object({
  tenantId: z.string().uuid(),
  cycleId: z.string().uuid(),
  email: z.string().email().max(254),
  label: z.string().max(80).optional(),
});

stakeholderRoutes.post(
  '/invite',
  requireAuth,
  requireCsrf,
  async (c) => {
    const body = Invite.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const userId = c.get('userId') as string;
    const issued = await inviteStakeholder({ ...body.data, invitedBy: userId });
    const tpl = renderMagicLinkEmail({
      url: stakeholderUrl(issued.rawToken),
      purpose: 'tenant_invite',
      expiresInMinutes: 30 * 24 * 60,
      recipientName: body.data.label ?? null,
    });
    await sendTracked({
      template: 'stakeholder.invite',
      toEmail: body.data.email,
      subject: 'You have been invited to share feedback',
      html: tpl.html,
      text: tpl.text,
      tenantId: body.data.tenantId,
    });
    return c.json({ id: issued.id }, 201);
  },
);

const Submit = z.object({
  questionId: z.string().uuid().optional(),
  rawValue: z.unknown().optional(),
  freeText: z.string().max(8000).optional(),
  uploadedArtifactId: z.string().uuid().optional(),
});

stakeholderRoutes.post(
  '/:token/respond',
  rateLimit({ capacity: 30, refillPerSec: 1, scope: 'ip', bucket: 'stakeholder:respond' }),
  async (c) => {
    const body = Submit.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const token = c.req.param('token');
    const stakeholder = await resolveStakeholderToken(token);
    if (!stakeholder || stakeholder.optedOutAt || stakeholder.revokedAt) throw notFound();
    await submitStakeholderResponse({
      stakeholderId: stakeholder.id,
      ...body.data,
    });
    return c.json({ ok: true });
  },
);

stakeholderRoutes.post(
  '/:token/opt-out',
  rateLimit({ capacity: 5, refillPerSec: 0.1, scope: 'ip', bucket: 'stakeholder:opt-out' }),
  async (c) => {
    const token = c.req.param('token');
    await optOutStakeholder(token);
    return c.json({ ok: true });
  },
);

stakeholderRoutes.get(
  '/:token/context',
  rateLimit({ capacity: 30, refillPerSec: 1, scope: 'ip', bucket: 'stakeholder:context' }),
  async (c) => {
    const token = c.req.param('token');
    const stakeholder = await resolveStakeholderToken(token);
    if (!stakeholder || stakeholder.optedOutAt || stakeholder.revokedAt) throw notFound();
    return c.json({
      cycleId: stakeholder.cycleId,
      label: stakeholder.label,
    });
  },
);

stakeholderRoutes.get(
  '/tenant/:tid/cycle/:cid',
  requireAuth,
  requireTenantMembership('tid'),
  async (c) => {
    return c.json({ stakeholders: [] });
  },
);
