import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireCsrf, requireRole, requireTenantMembership } from '../lib/guard.js';
import {
  createTenant,
  listMembers,
  listMyTenants,
  removeMember,
  setRole,
  softDeleteTenant,
  transferOwnership,
  restoreTenant,
} from '../lib/tenants/service.js';
import { badRequest } from '../lib/problem.js';

export const tenantRoutes = new Hono();

tenantRoutes.use('*', requireAuth);
tenantRoutes.use('*', requireCsrf);

const CreateBody = z.object({ displayName: z.string().min(2).max(80) });

tenantRoutes.post('/', async (c) => {
  const body = CreateBody.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const userId = c.get('userId') as string;
  const t = await createTenant(userId, body.data.displayName);
  return c.json({ id: t.id, slug: t.slug }, 201);
});

tenantRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const tenants = await listMyTenants(userId);
  return c.json({ tenants });
});

tenantRoutes.get('/:tid/members', requireTenantMembership('tid'), async (c) => {
  const tenantId = c.req.param('tid');
  const members = await listMembers(tenantId);
  return c.json({ members });
});

const RoleBody = z.object({ role: z.enum(['owner', 'admin', 'editor', 'viewer']) });

tenantRoutes.patch(
  '/:tid/members/:uid/role',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const body = RoleBody.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    try {
      await setRole(c.req.param('tid'), c.req.param('uid'), body.data.role);
      return c.json({ ok: true });
    } catch (err) {
      throw badRequest((err as Error).message);
    }
  },
);

tenantRoutes.delete(
  '/:tid/members/:uid',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    try {
      await removeMember(c.req.param('tid'), c.req.param('uid'));
      return c.json({ ok: true });
    } catch (err) {
      throw badRequest((err as Error).message);
    }
  },
);

const TransferBody = z.object({ toUserId: z.string().uuid() });

tenantRoutes.post(
  '/:tid/ownership/transfer',
  requireTenantMembership('tid'),
  requireRole('owner'),
  async (c) => {
    const body = TransferBody.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    await transferOwnership(c.req.param('tid'), c.get('userId') as string, body.data.toUserId);
    return c.json({ ok: true });
  },
);

tenantRoutes.delete('/:tid', requireTenantMembership('tid'), requireRole('owner'), async (c) => {
  await softDeleteTenant(c.req.param('tid'), c.get('userId') as string);
  return c.json({ ok: true, restoreWindowDays: 7 });
});

tenantRoutes.post(
  '/:tid/restore',
  requireTenantMembership('tid'),
  requireRole('owner'),
  async (c) => {
    await restoreTenant(c.req.param('tid'));
    return c.json({ ok: true });
  },
);
