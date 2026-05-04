import { Hono } from 'hono';
import { z } from 'zod';
import { renderMagicLinkEmail } from '@ilinga/emails';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { config } from '../config.js';
import { sendTracked } from '../lib/mailer.js';
import { issueMagicLink, consumeMagicLink, type MagicLinkPurpose } from '../lib/auth/magic-link.js';
import { setUserEmail, softDeleteUser, upsertUser } from '../lib/auth/users.js';
import { getMembership } from '../lib/tenants/service.js';
import { schema, getDb } from '@ilinga/db';
import { createSession, resolveSession, revokeSession } from '../lib/auth/sessions.js';
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  profileFromIdToken,
} from '../lib/auth/oauth-google.js';
import {
  CSRF_COOKIE,
  clearAuthCookies,
  readSession,
  writeCsrfCookie,
  writeSessionCookie,
} from '../lib/cookies.js';
import { rateLimit } from '../lib/rate-limit.js';
import { badRequest, unauthorized } from '../lib/problem.js';

export const authRoutes = new Hono();

const RequestSchema = z.object({
  email: z.string().email().max(254),
  purpose: z
    .enum([
      'signup',
      'signin',
      'tenant_invite',
      'email_change_verify',
      'account_recovery',
      'step_up',
    ])
    .default('signin'),
  metadata: z.record(z.unknown()).optional(),
});

authRoutes.post(
  '/magic-link/request',
  rateLimit({ capacity: 5, refillPerSec: 1 / 12, scope: 'ip', bucket: 'auth:ml-req' }),
  async (c) => {
    const body = RequestSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) {
      // anti-enumeration: always 200 even on bad input
      return c.json({ ok: true });
    }
    const cfg = config();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    try {
      const linkInput = {
        email: body.data.email,
        purpose: body.data.purpose,
        ...(ip ? { requestIp: ip } : {}),
        ...(body.data.metadata ? { metadata: body.data.metadata } : {}),
      } as const;
      const link = await issueMagicLink(linkInput);
      const tpl = renderMagicLinkEmail({
        url: link.url,
        purpose: body.data.purpose,
        expiresInMinutes: cfg.IL_MAGIC_LINK_TTL_MIN,
      });
      await sendTracked({
        template: `magic_link.${body.data.purpose}`,
        toEmail: body.data.email,
        subject:
          body.data.purpose === 'tenant_invite'
            ? 'You have been invited to a workspace'
            : 'Your Ilinga sign-in link',
        html: tpl.html,
        text: tpl.text,
      });
    } catch (err) {
      // anti-enumeration: still 200, but we DO log so dev can see why an
      // email never landed (Mailpit down, SMTP misconfigured, etc.).
      (c.get('logger') as ReturnType<typeof import('../lib/logger.js').logger>)?.warn(
        { err: { message: (err as Error).message } },
        'magic-link request failed (silent)',
      );
    }
    return c.json({ ok: true });
  },
);

const VerifySchema = z.object({ token: z.string().min(16).max(128) });

authRoutes.post('/magic-link/verify', async (c) => {
  const body = VerifySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid request');
  const result = await consumeMagicLink(body.data.token);
  if (!result.ok || !result.email || !result.purpose) {
    throw unauthorized('Invalid or expired link');
  }
  const user = await upsertUser({ email: result.email });

  // tenant_invite metadata.{tenantId, role}: atomically add the user to the
  // tenant on first redemption. Idempotent: if the membership already
  // exists we leave it alone.
  let invitedTenantId: string | null = null;
  let invitedRole: string | null = null;
  if (result.purpose === 'tenant_invite' && result.metadata) {
    const md = result.metadata as { tenantId?: unknown; role?: unknown };
    if (typeof md.tenantId === 'string' && typeof md.role === 'string') {
      invitedTenantId = md.tenantId;
      invitedRole = md.role;
      const existing = await getMembership(md.tenantId, user.id);
      if (!existing) {
        await getDb()
          .insert(schema.tenantMembers)
          .values({ tenantId: md.tenantId, userId: user.id, role: md.role });
      }
    }
  }

  // email_change_verify metadata.newEmail: swap users.email atomically.
  if (result.purpose === 'email_change_verify' && result.metadata) {
    const md = result.metadata as { newEmail?: unknown; userId?: unknown };
    if (typeof md.newEmail === 'string' && typeof md.userId === 'string') {
      await setUserEmail(md.userId, md.newEmail);
    }
  }

  const session = await createSession({
    userId: user.id,
    ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: c.req.header('user-agent') ?? undefined,
  });
  writeSessionCookie(c, session.rawToken, session.expiresAt);
  writeCsrfCookie(c, session.csrfToken);
  return c.json({
    ok: true,
    user: { id: user.id, email: user.email, displayName: user.displayName },
    purpose: result.purpose as MagicLinkPurpose,
    metadata: result.metadata,
    invitedTenantId,
    invitedRole,
  });
});

authRoutes.post('/sign-out', async (c) => {
  const raw = readSession(c);
  if (raw) {
    const sess = await resolveSession(raw);
    if (sess) await revokeSession(sess.sessionId);
  }
  clearAuthCookies(c);
  return c.json({ ok: true });
});

const OAUTH_STATE_COOKIE = 'il_oauth_state';

authRoutes.get('/google/start', (c) => {
  const cfg = config();
  if (!cfg.GOOGLE_OAUTH_CLIENT_ID) {
    return c.json({ type: 'about:blank', title: 'Google OAuth not configured', status: 503 }, 503);
  }
  const built = buildGoogleAuthUrl();
  setCookie(
    c,
    OAUTH_STATE_COOKIE,
    JSON.stringify({
      state: built.state,
      nonce: built.nonce,
      codeVerifier: built.codeVerifier,
    }),
    {
      domain: cfg.IL_COOKIE_DOMAIN,
      path: '/',
      httpOnly: true,
      secure: cfg.NODE_ENV !== 'development',
      sameSite: 'Lax',
      maxAge: 600,
    },
  );
  return c.redirect(built.authUrl, 302);
});

authRoutes.get('/google/callback', async (c) => {
  const cfg = config();
  const state = c.req.query('state');
  const code = c.req.query('code');
  if (!state || !code) throw badRequest('missing state or code');
  const cookie = getCookie(c, OAUTH_STATE_COOKIE);
  if (!cookie) throw badRequest('missing oauth state');
  const parsed = JSON.parse(cookie) as { state: string; nonce: string; codeVerifier: string };
  if (parsed.state !== state) throw badRequest('state mismatch');
  deleteCookie(c, OAUTH_STATE_COOKIE, { domain: cfg.IL_COOKIE_DOMAIN, path: '/' });

  const tokens = await exchangeGoogleCode(code, parsed.codeVerifier);
  const profile = profileFromIdToken(tokens.id_token, parsed.nonce);
  if (!profile.emailVerified) {
    throw unauthorized(
      'Google account email is not verified — please verify with Google or use a magic link.',
    );
  }
  const user = await upsertUser({
    email: profile.email,
    displayName: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
  });
  const session = await createSession({
    userId: user.id,
    ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: c.req.header('user-agent') ?? undefined,
  });
  writeSessionCookie(c, session.rawToken, session.expiresAt);
  writeCsrfCookie(c, session.csrfToken);
  return c.redirect(`${cfg.IL_WEB_ORIGIN}/auth/callback/google?ok=1`, 302);
});

authRoutes.get('/me', async (c) => {
  const raw = readSession(c);
  if (!raw) throw unauthorized();
  const sess = await resolveSession(raw);
  if (!sess) throw unauthorized();
  return c.json({ userId: sess.userId, expiresAt: sess.expiresAt });
});

authRoutes.get('/csrf', (c) => {
  const existing = getCookie(c, CSRF_COOKIE);
  return c.json({ csrf: existing ?? null });
});

authRoutes.delete('/account', async (c) => {
  const raw = readSession(c);
  if (!raw) throw unauthorized();
  const sess = await resolveSession(raw);
  if (!sess) throw unauthorized();
  await softDeleteUser(sess.userId);
  clearAuthCookies(c);
  return c.json({ ok: true, hardDeletesIn: '7d' });
});
