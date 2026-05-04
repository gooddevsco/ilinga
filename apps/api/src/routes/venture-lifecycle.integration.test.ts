import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const DB_URL = process.env.IL_DB_URL;
const HAS_DB = !!DB_URL;
const d = HAS_DB ? describe : describe.skip;

// Imports must be dynamic so config caching does not lock in stale env when
// the suite is run without IL_DB_URL.
type App = typeof import('../index.js').app;
type Db = ReturnType<typeof import('@ilinga/db').getDb>;
type Schema = typeof import('@ilinga/db').schema;
type IssueMagicLink = typeof import('../lib/auth/magic-link.js').issueMagicLink;

let app: App;
let getDb: () => Db;
let closeDb: () => Promise<void>;
let schema: Schema;
let issueMagicLink: IssueMagicLink;

const headers = (cookies: string[], csrf?: string, extra: Record<string, string> = {}) => {
  const h: Record<string, string> = {
    'content-type': 'application/json',
    cookie: cookies.join('; '),
    ...extra,
  };
  if (csrf) h['x-il-csrf'] = csrf;
  return h;
};

const parseSetCookies = (res: Response): string[] => {
  // Hono returns a single combined Set-Cookie header per call; multiple
  // setCookie() calls produce multiple header entries that get joined.
  // node-fetch/undici exposes .getSetCookie(); fall back to splitting.
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const raw = res.headers.get('set-cookie');
  return raw ? raw.split(/,(?=[^;]+=)/g).map((s) => s.trim()) : [];
};

const cookieValue = (setCookies: string[], name: string): string | undefined => {
  for (const sc of setCookies) {
    const first = sc.split(';')[0];
    if (!first) continue;
    const [k, v] = first.split('=');
    if (k === name) return v;
  }
  return undefined;
};

d('venture lifecycle (end-to-end)', () => {
  const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e-${RUN_ID}@ilinga.test`;
  const tenantName = `E2E ${RUN_ID}`;
  const ventureName = `Venture ${RUN_ID}`;

  let sessionCookie = '';
  let csrfCookie = '';
  let userId: string;
  let tenantId: string;
  let ventureId: string;
  let cycleId: string;
  let questionId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Lazy imports so config()'s cache picks up NODE_ENV=test.
    ({ app } = await import('../index.js'));
    const db = await import('@ilinga/db');
    getDb = db.getDb;
    closeDb = db.closeDb;
    schema = db.schema;
    ({ issueMagicLink } = await import('../lib/auth/magic-link.js'));

    // Pick a seeded question we will answer later.
    const qrows = await getDb()
      .select({ id: schema.questions.id })
      .from(schema.questions)
      .where(eq(schema.questions.code, 'P1.1'))
      .limit(1);
    if (!qrows[0]) throw new Error('seed missing: questions.P1.1 — run pnpm db:seed');
    questionId = qrows[0].id;
  });

  afterAll(async () => {
    // Best-effort cleanup. Tenant soft-delete already happened via the test;
    // close the pool so vitest can exit cleanly.
    await closeDb?.();
  });

  it('signup: issues + consumes a magic link and returns auth cookies', async () => {
    // Mint a magic link directly (production code path, just bypassing the
    // anti-enumeration HTTP envelope so the test can read the raw token).
    const link = await issueMagicLink({ email, purpose: 'signup' });

    const res = await app.request('/v1/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: link.rawToken }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string }; purpose: string };
    expect(body.purpose).toBe('signup');
    expect(body.user.email).toBe(email);
    userId = body.user.id;

    const setCookies = parseSetCookies(res);
    const il_session = cookieValue(setCookies, 'il_session');
    const il_csrf = cookieValue(setCookies, 'il_csrf');
    expect(il_session, 'il_session cookie issued').toBeTruthy();
    expect(il_csrf, 'il_csrf cookie issued').toBeTruthy();
    sessionCookie = `il_session=${il_session}`;
    csrfCookie = il_csrf!;
  });

  it('GET /v1/auth/me returns the session for the new user', async () => {
    const res = await app.request('/v1/auth/me', {
      headers: { cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: string };
    expect(body.userId).toBe(userId);
  });

  it('creates a tenant for the signed-in user', async () => {
    const res = await app.request('/v1/tenants', {
      method: 'POST',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
      body: JSON.stringify({ displayName: tenantName }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; slug: string };
    expect(body.id).toBeTruthy();
    expect(body.slug).toMatch(/^e2e-/);
    tenantId = body.id;
  });

  it('lists tenants for the user (sanity check on owner role)', async () => {
    const res = await app.request('/v1/tenants', { headers: { cookie: sessionCookie } });
    expect(res.status).toBe(200);
    const { tenants } = (await res.json()) as {
      tenants: { id: string; slug: string; role: string }[];
    };
    const mine = tenants.find((t) => t.id === tenantId);
    expect(mine?.role).toBe('owner');
  });

  it('starts a free-plan subscription with seeded credits on tenant create', async () => {
    const subs = await getDb()
      .select({
        status: schema.subscriptions.status,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.tenantId, tenantId));
    expect(subs[0]?.status).toBe('active');

    const cred = await getDb()
      .select({ balance: schema.credits.balance })
      .from(schema.credits)
      .where(eq(schema.credits.tenantId, tenantId));
    expect(cred[0]?.balance).toBeGreaterThan(0);
  });

  it('creates a venture (which auto-opens cycle 1)', async () => {
    const res = await app.request('/v1/ventures', {
      method: 'POST',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
      body: JSON.stringify({
        tenantId,
        name: ventureName,
        industry: 'fintech',
        geos: ['gb', 'us'],
        brief: { thesis: 'initial' },
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      venture: { id: string; name: string; geos: string[] };
      cycle: { id: string; seq: number; status: string };
    };
    expect(body.venture.name).toBe(ventureName);
    expect(body.venture.geos).toEqual(['gb', 'us']);
    expect(body.cycle.seq).toBe(1);
    expect(body.cycle.status).toBe('open');
    ventureId = body.venture.id;
    cycleId = body.cycle.id;
  });

  it('updates the venture brief', async () => {
    const res = await app.request(`/v1/ventures/tenant/${tenantId}/${ventureId}/brief`, {
      method: 'PATCH',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
      body: JSON.stringify({ brief: { thesis: 'updated', stage: 'pre-seed' } }),
    });
    expect(res.status).toBe(200);

    const get = await app.request(`/v1/ventures/tenant/${tenantId}/${ventureId}`, {
      headers: { cookie: sessionCookie },
    });
    const { venture } = (await get.json()) as {
      venture: { brief: { thesis: string; stage: string } };
    };
    expect(venture.brief).toMatchObject({ thesis: 'updated', stage: 'pre-seed' });
  });

  it('lists cycles for the venture', async () => {
    const res = await app.request(`/v1/ventures/tenant/${tenantId}/${ventureId}/cycles`, {
      headers: { cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const { cycles } = (await res.json()) as { cycles: { id: string; seq: number }[] };
    expect(cycles.map((c) => c.seq)).toContain(1);
  });

  it('upserts an interview answer (optimistic version)', async () => {
    const put = await app.request(`/v1/cycles/${cycleId}/answers`, {
      method: 'PUT',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie, {
        'x-il-tenant-id': tenantId,
      }),
      body: JSON.stringify({ questionId, rawValue: 'Mid-market CFOs at series-B fintechs.' }),
    });
    expect(put.status).toBe(200);
    const body = (await put.json()) as { id: string; version: number };
    expect(body.version).toBe(1);
    expect(put.headers.get('etag')).toBe('1');

    // Second upsert with matching If-Match bumps version to 2.
    const put2 = await app.request(`/v1/cycles/${cycleId}/answers`, {
      method: 'PUT',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie, {
        'x-il-tenant-id': tenantId,
        'if-match': '1',
      }),
      body: JSON.stringify({ questionId, rawValue: 'Refined: post-Series-B fintech CFOs.' }),
    });
    expect(put2.status).toBe(200);
    const body2 = (await put2.json()) as { version: number };
    expect(body2.version).toBe(2);

    // Stale If-Match returns 412.
    const stale = await app.request(`/v1/cycles/${cycleId}/answers`, {
      method: 'PUT',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie, {
        'x-il-tenant-id': tenantId,
        'if-match': '1',
      }),
      body: JSON.stringify({ questionId, rawValue: 'Stale write attempt.' }),
    });
    expect(stale.status).toBe(412);
  });

  it('lists answers for the cycle', async () => {
    const res = await app.request(`/v1/cycles/${cycleId}/answers`, {
      headers: { cookie: sessionCookie, 'x-il-tenant-id': tenantId },
    });
    expect(res.status).toBe(200);
    const { answers } = (await res.json()) as {
      answers: { questionId: string; version: number }[];
    };
    const ours = answers.find((a) => a.questionId === questionId);
    expect(ours?.version).toBe(2);
  });

  it('overrides content keys (manual content-key override path used by editors)', async () => {
    for (const [code, value] of [
      ['narrative.summary', 'Narrative override for E2E test.'],
      ['risk.top', { label: 'Adoption risk', severity: 'medium' }],
    ] as const) {
      const res = await app.request(`/v1/content-keys/tenant/${tenantId}/override`, {
        method: 'POST',
        headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
        body: JSON.stringify({ cycleId, code, value }),
      });
      expect([200, 201], `override ${code} status`).toContain(res.status);
    }

    const list = await app.request(`/v1/content-keys/tenant/${tenantId}/cycle/${cycleId}`, {
      headers: { cookie: sessionCookie },
    });
    const { keys } = (await list.json()) as { keys: { code: string }[] };
    const codes = keys.map((k) => k.code).sort();
    expect(codes).toEqual(['narrative.summary', 'risk.top']);
  });

  it('renders an Investor Pulse report from the seeded template', async () => {
    const res = await app.request(`/v1/reports/tenant/${tenantId}/render`, {
      method: 'POST',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
      body: JSON.stringify({
        cycleId,
        templateCode: 'investor_pulse',
        title: 'E2E Pulse',
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reportId: string; renderId: string };
    expect(body.reportId).toBeTruthy();
    expect(body.renderId).toBeTruthy();

    const list = await app.request(`/v1/reports/tenant/${tenantId}/cycle/${cycleId}`, {
      headers: { cookie: sessionCookie },
    });
    const { reports } = (await list.json()) as { reports: { id: string; title: string }[] };
    expect(reports.find((r) => r.id === body.reportId)?.title).toBe('E2E Pulse');
  });

  it('soft-deletes the venture and writes a tombstone', async () => {
    const res = await app.request(`/v1/ventures/tenant/${tenantId}/${ventureId}`, {
      method: 'DELETE',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; restoreWindowDays: number };
    expect(body).toEqual({ ok: true, restoreWindowDays: 30 });

    const list = await app.request(`/v1/ventures/tenant/${tenantId}`, {
      headers: { cookie: sessionCookie },
    });
    const { ventures } = (await list.json()) as { ventures: { id: string }[] };
    expect(ventures.find((v) => v.id === ventureId)).toBeUndefined();

    const tombstone = await getDb()
      .select()
      .from(schema.deletionTombstones)
      .where(eq(schema.deletionTombstones.targetId, ventureId));
    expect(tombstone[0]?.targetTable).toBe('ventures');
  });

  it('signs out and invalidates the session', async () => {
    const out = await app.request('/v1/auth/sign-out', {
      method: 'POST',
      headers: headers([sessionCookie, `il_csrf=${csrfCookie}`], csrfCookie),
    });
    expect(out.status).toBe(200);

    const me = await app.request('/v1/auth/me', { headers: { cookie: sessionCookie } });
    expect(me.status).toBe(401);
  });
});
