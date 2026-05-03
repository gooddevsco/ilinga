import type { MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { rateLimit } from './rate-limit.js';
import { forbidden } from './problem.js';

/**
 * Global token bucket per-IP for any write method. Sits before route-specific
 * limits — we expect tenant tokens to fan-out fairly across tenants but still
 * cap per-IP to make a global brute-force attempt expensive.
 */
export const globalWriteLimit: MiddlewareHandler = async (c, next) => {
  const method = c.req.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }
  return rateLimit({
    capacity: 100,
    refillPerSec: 5,
    scope: 'ip',
    bucket: 'global:write',
  })(c, next);
};

const READ_ONLY_STATUSES = new Set(['unpaid', 'paused', 'cancelled']);

/**
 * Read-only enforcement: any write that touches a tenant context (tenantId
 * is set after requireTenantMembership) is rejected with 403 when the
 * tenant's subscription is in a read-only state.
 *
 * Intentionally allows /v1/billing/* writes through so the tenant can fix
 * the situation. Allows /v1/auth/sign-out so the user can log out.
 */
export const enforceReadOnly: MiddlewareHandler = async (c, next) => {
  const method = c.req.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/v1/billing/')) return next();
  if (path === '/v1/auth/sign-out') return next();
  if (path.startsWith('/v1/internal/')) return next();
  const tenantId = c.get('tenantId') as string | undefined;
  if (!tenantId) return next();
  const rows = await getDb()
    .select({ status: schema.subscriptions.status })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.tenantId, tenantId))
    .limit(1);
  const status = rows[0]?.status ?? 'active';
  if (READ_ONLY_STATUSES.has(status)) {
    throw forbidden('workspace is read-only — update billing to restore writes');
  }
  await next();
};

const SAMPLE_PATH_PREFIXES = ['/v1/'];
const SKIP_PATHS = ['/v1/internal/healthz', '/v1/internal/readyz'];

/**
 * Per-tenant + per-actor API request log writer. Best-effort: failures here
 * never block the response. Retained for 7d at the DB layer (see retention
 * worker) and queried by the per-tenant 'API request log' surface.
 */
export const apiRequestLog: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  try {
    const path = new URL(c.req.url).pathname;
    if (!SAMPLE_PATH_PREFIXES.some((p) => path.startsWith(p))) return;
    if (SKIP_PATHS.includes(path)) return;
    const tenantId = (c.get('tenantId') as string | undefined) ?? null;
    const actorUserId = (c.get('userId') as string | undefined) ?? null;
    const requestId = (c.get('requestId') as string | undefined) ?? null;
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const latency = Math.round(performance.now() - start);
    void getDb()
      .insert(schema.apiRequestLog)
      .values({
        tenantId,
        actorUserId,
        method: c.req.method,
        path,
        status: c.res.status,
        latencyMs: latency,
        requestId,
        ip,
      })
      .catch(() => undefined);
  } catch {
    /* swallow */
  }
};
