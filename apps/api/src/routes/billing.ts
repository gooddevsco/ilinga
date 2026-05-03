import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { config } from '../config.js';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { createDodoCheckout, verifyDodoSignature } from '../lib/billing/dodo.js';
import { adjustCredits, creditBalance, setAutoTopup } from '../lib/billing/credits.js';
import { badRequest, notFound, unauthorized } from '../lib/problem.js';

export const billingRoutes = new Hono();

const Subscribe = z.object({ planCode: z.string().min(2).max(64) });

billingRoutes.post(
  '/tenant/:tid/subscribe/checkout',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const body = Subscribe.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const cfg = config();
    const db = getDb();
    const planRows = await db
      .select()
      .from(schema.plans)
      .where(eq(schema.plans.code, body.data.planCode))
      .limit(1);
    if (!planRows[0]) throw notFound('plan');
    const checkout = await createDodoCheckout({
      productId: planRows[0].dodoProductId ?? `mock_${planRows[0].code}`,
      metadata: { tenant_id: c.req.param('tid'), plan_code: planRows[0].code },
      successUrl: `${cfg.IL_WEB_ORIGIN}/credits?checkout=success`,
      cancelUrl: `${cfg.IL_WEB_ORIGIN}/credits?checkout=cancel`,
    });
    return c.json(checkout);
  },
);

const Topup = z.object({ packCode: z.string().min(2).max(64) });

billingRoutes.post(
  '/tenant/:tid/topup/checkout',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const body = Topup.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const cfg = config();
    const db = getDb();
    const packRows = await db
      .select()
      .from(schema.creditPacks)
      .where(eq(schema.creditPacks.code, body.data.packCode))
      .limit(1);
    if (!packRows[0]) throw notFound('pack');
    const checkout = await createDodoCheckout({
      productId: packRows[0].dodoProductId ?? `mock_${packRows[0].code}`,
      metadata: { tenant_id: c.req.param('tid'), pack_code: packRows[0].code },
      successUrl: `${cfg.IL_WEB_ORIGIN}/credits?checkout=success`,
      cancelUrl: `${cfg.IL_WEB_ORIGIN}/credits?checkout=cancel`,
    });
    return c.json(checkout);
  },
);

const AutoTopup = z.object({
  enabled: z.boolean(),
  thresholdCredits: z.number().int().min(1).max(1_000_000),
  packCode: z.string().min(2).max(64),
  monthlyCapCents: z.number().int().min(0).optional(),
});

billingRoutes.put(
  '/tenant/:tid/auto-topup',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const body = AutoTopup.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    await setAutoTopup({ tenantId: c.req.param('tid'), ...body.data });
    return c.json({ ok: true });
  },
);

billingRoutes.get(
  '/tenant/:tid/balance',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const balance = await creditBalance(c.req.param('tid'));
    return c.json({ balance });
  },
);

billingRoutes.get(
  '/tenant/:tid/subscription',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const rows = await getDb()
      .select({
        status: schema.subscriptions.status,
        currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: schema.subscriptions.cancelAtPeriodEnd,
        trialEndsAt: schema.subscriptions.trialEndsAt,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.tenantId, c.req.param('tid')))
      .limit(1);
    return c.json({
      status: rows[0]?.status ?? 'unknown',
      currentPeriodEnd: rows[0]?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: rows[0]?.cancelAtPeriodEnd ?? false,
      trialEndsAt: rows[0]?.trialEndsAt ?? null,
    });
  },
);

billingRoutes.get(
  '/tenant/:tid/auto-topup',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const rows = await getDb()
      .select()
      .from(schema.autoTopups)
      .where(eq(schema.autoTopups.tenantId, c.req.param('tid')))
      .limit(1);
    return c.json({ config: rows[0] ?? null });
  },
);

billingRoutes.get(
  '/tenant/:tid/invoices',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const rows = await getDb()
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.tenantId, c.req.param('tid')))
      .orderBy(desc(schema.invoices.issuedAt))
      .limit(100);
    return c.json({ invoices: rows });
  },
);

const Redeem = z.object({ code: z.string().min(2).max(64) });

billingRoutes.post(
  '/tenant/:tid/coupons/redeem',
  requireAuth,
  requireCsrf,
  requireTenantMembership('tid'),
  async (c) => {
    const body = Redeem.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const tenantId = c.req.param('tid');
    const db = getDb();
    const coupons = await db
      .select()
      .from(schema.coupons)
      .where(eq(schema.coupons.code, body.data.code))
      .limit(1);
    const coupon = coupons[0];
    if (!coupon) throw notFound('coupon');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw badRequest('coupon expired');
    if (coupon.maxRedemptions !== null && coupon.redeemed >= coupon.maxRedemptions)
      throw badRequest('coupon exhausted');
    const dup = await db
      .select()
      .from(schema.couponRedemptions)
      .where(
        and(
          eq(schema.couponRedemptions.tenantId, tenantId),
          eq(schema.couponRedemptions.couponId, coupon.id),
        ),
      )
      .limit(1);
    if (dup[0]) throw badRequest('already redeemed');
    await db.transaction(async (tx) => {
      await tx.insert(schema.couponRedemptions).values({ tenantId, couponId: coupon.id });
      await tx
        .update(schema.coupons)
        .set({ redeemed: coupon.redeemed + 1 })
        .where(eq(schema.coupons.id, coupon.id));
    });
    return c.json({
      ok: true,
      percentOff: coupon.percentOff,
      amountOffCents: coupon.amountOffCents,
      durationMonths: coupon.durationMonths,
    });
  },
);

billingRoutes.post('/dodo', async (c) => {
  const cfg = config();
  const secret = process.env.DODO_WEBHOOK_SECRET ?? '';
  if (!secret) throw unauthorized('webhook secret not configured');
  const raw = await c.req.text();
  const sig = c.req.header('dodo-signature') ?? c.req.header('Dodo-Signature');
  if (!verifyDodoSignature(raw, sig ?? undefined, secret)) throw unauthorized('bad signature');
  const event = JSON.parse(raw) as {
    id: string;
    type: string;
    data?: { metadata?: Record<string, string>; amount_cents?: number };
  };
  if (event.type === 'checkout.completed') {
    const tenantId = event.data?.metadata?.tenant_id;
    const packCode = event.data?.metadata?.pack_code;
    const planCode = event.data?.metadata?.plan_code;
    if (tenantId && packCode) {
      const db = getDb();
      const packs = await db
        .select()
        .from(schema.creditPacks)
        .where(eq(schema.creditPacks.code, packCode))
        .limit(1);
      if (packs[0]) {
        await adjustCredits({
          tenantId,
          delta: packs[0].credits,
          reason: 'topup',
          refType: 'credit_pack',
          refId: packs[0].id,
          dodoEventId: event.id,
        });
      }
    }
    if (tenantId && planCode) {
      const db = getDb();
      const plans = await db
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.code, planCode))
        .limit(1);
      if (plans[0]) {
        const subRows = await db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.tenantId, tenantId))
          .limit(1);
        if (subRows[0]) {
          await db
            .update(schema.subscriptions)
            .set({ planId: plans[0].id, status: 'active', updatedAt: new Date() })
            .where(eq(schema.subscriptions.id, subRows[0].id));
        } else {
          await db.insert(schema.subscriptions).values({
            tenantId,
            planId: plans[0].id,
            status: 'active',
          });
        }
      }
    }
  }
  void cfg;
  return c.json({ ok: true });
});
