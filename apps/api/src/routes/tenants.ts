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
  updateTenant,
  verifyCustomDomain,
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

const PatchBody = z.object({
  displayName: z.string().min(2).max(80).optional(),
  industry: z.string().max(80).nullable().optional(),
  countryCode: z.string().length(2).nullable().optional(),
  brandLogoUrl: z.string().url().max(2048).nullable().optional(),
  brandAccentHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/u, 'must be #RRGGBB')
    .nullable()
    .optional(),
  customDomain: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/u, 'invalid domain')
    .nullable()
    .optional(),
});

tenantRoutes.patch(
  '/:tid',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const body = PatchBody.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest(body.error.message);
    await updateTenant(c.req.param('tid'), body.data);
    return c.json({ ok: true });
  },
);

tenantRoutes.post(
  '/:tid/custom-domain/verify',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    // Real implementation issues a DNS TXT challenge; for the platform's MVP
    // we simply mark verified after a successful round-trip from the admin
    // who owns the DNS for the configured domain. The on-demand TLS endpoint
    // (/v1/internal/tls-allowed) keys off this row.
    await verifyCustomDomain(c.req.param('tid'));
    return c.json({ ok: true, verifiedAt: new Date().toISOString() });
  },
);
