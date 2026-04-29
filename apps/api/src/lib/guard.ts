import type { MiddlewareHandler } from 'hono';
import { and, eq, isNull } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { resolveSession, slideSession } from './auth/sessions.js';
import { readSession, readCsrf } from './cookies.js';
import { unauthorized, forbidden } from './problem.js';

export type TenantRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'stakeholder';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const raw = readSession(c);
  if (!raw) throw unauthorized();
  const sess = await resolveSession(raw);
  if (!sess) throw unauthorized();
  c.set('userId', sess.userId);
  c.set('sessionId', sess.sessionId);
  await slideSession(sess.sessionId);
  await next();
};

export const requireCsrf: MiddlewareHandler = async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    return next();
  }
  const cookie = readCsrf(c);
  const header = c.req.header('x-il-csrf');
  if (!cookie || !header || cookie !== header) throw forbidden('CSRF check failed');
  await next();
};

export const requireTenantMembership = (param = 'tid'): MiddlewareHandler => async (c, next) => {
  const userId = c.get('userId') as string | undefined;
  if (!userId) throw unauthorized();
  const tenantId = c.req.param(param);
  if (!tenantId) throw forbidden('tenant param required');
  const rows = await getDb()
    .select({ role: schema.tenantMembers.role, suspendedAt: schema.tenantMembers.suspendedAt })
    .from(schema.tenantMembers)
    .where(
      and(
        eq(schema.tenantMembers.tenantId, tenantId),
        eq(schema.tenantMembers.userId, userId),
        isNull(schema.tenantMembers.suspendedAt),
      ),
    )
    .limit(1);
  const m = rows[0];
  if (!m) throw forbidden('not a member');
  c.set('tenantId', tenantId);
  c.set('tenantRole', m.role as TenantRole);
  await next();
};

export const requireRole = (...allowed: TenantRole[]): MiddlewareHandler => async (c, next) => {
  const role = c.get('tenantRole') as TenantRole | undefined;
  if (!role || !allowed.includes(role)) throw forbidden('role check failed');
  await next();
};
