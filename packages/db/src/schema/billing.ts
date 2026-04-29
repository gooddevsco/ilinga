import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    displayName: text('display_name').notNull(),
    monthlyUsdCents: integer('monthly_usd_cents').notNull(),
    monthlyCredits: integer('monthly_credits').notNull(),
    seats: integer('seats').notNull(),
    dodoProductId: text('dodo_product_id'),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [uniqueIndex('plans_code_uniq').on(t.code)],
);

export const creditPacks = pgTable(
  'credit_packs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    credits: integer('credits').notNull(),
    usdCents: integer('usd_cents').notNull(),
    dodoProductId: text('dodo_product_id'),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [uniqueIndex('credit_packs_code_uniq').on(t.code)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    planId: uuid('plan_id').notNull(),
    status: text('status').notNull().default('trialing'),
    dodoSubscriptionId: text('dodo_subscription_id'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('subscriptions_tenant_uniq').on(t.tenantId),
    index('subscriptions_status_idx').on(t.status),
  ],
);

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    delta: integer('delta').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    reason: text('reason').notNull(),
    refType: text('ref_type'),
    refId: uuid('ref_id'),
    dodoEventId: text('dodo_event_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('credit_ledger_tenant_idx').on(t.tenantId, t.createdAt),
    uniqueIndex('credit_ledger_dodo_event_uniq').on(t.dodoEventId),
  ],
);

export const credits = pgTable(
  'credits',
  {
    tenantId: uuid('tenant_id').primaryKey(),
    balance: integer('balance').notNull().default(0),
    monthlyAllowance: integer('monthly_allowance').notNull().default(0),
    allowanceResetsAt: timestamp('allowance_resets_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export const autoTopups = pgTable(
  'auto_topups',
  {
    tenantId: uuid('tenant_id').primaryKey(),
    enabled: boolean('enabled').notNull().default(false),
    thresholdCredits: integer('threshold_credits').notNull().default(50),
    packCode: text('pack_code').notNull(),
    monthlyCapCents: integer('monthly_cap_cents'),
    spentThisPeriodCents: integer('spent_this_period_cents').notNull().default(0),
    periodResetsAt: timestamp('period_resets_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    dodoInvoiceId: text('dodo_invoice_id'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    pdfS3Key: text('pdf_s3_key'),
    companyName: text('company_name'),
    vatId: text('vat_id'),
    status: text('status').notNull().default('paid'),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (t) => [
    index('invoices_tenant_idx').on(t.tenantId, t.issuedAt),
    uniqueIndex('invoices_dodo_invoice_uniq').on(t.dodoInvoiceId),
  ],
);

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    percentOff: integer('percent_off'),
    amountOffCents: integer('amount_off_cents'),
    durationMonths: integer('duration_months'),
    maxRedemptions: integer('max_redemptions'),
    redeemed: integer('redeemed').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('coupons_code_uniq').on(t.code)],
);

export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    couponId: uuid('coupon_id').notNull(),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('coupon_redemptions_uniq').on(t.tenantId, t.couponId)],
);
