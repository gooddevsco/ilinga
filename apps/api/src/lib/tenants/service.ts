import { and, eq, isNull, sql } from 'drizzle-orm';
import { schema, getDb, generateDek, wrapDek } from '@ilinga/db';
import type { Database } from '@ilinga/db';

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `t-${Date.now().toString(36)}`;

export const createTenant = async (
  ownerUserId: string,
  displayName: string,
  region = 'eu',
): Promise<{ id: string; slug: string }> => {
  const db = getDb();
  let slug = slugify(displayName);
  let attempt = 0;
  while (attempt < 5) {
    const exists = await db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))
      .limit(1);
    if (!exists[0]) break;
    attempt += 1;
    slug = `${slugify(displayName)}-${attempt}`;
  }

  const [tenant] = await db
    .insert(schema.tenants)
    .values({ slug, displayName, region })
    .returning({ id: schema.tenants.id, slug: schema.tenants.slug });
  if (!tenant) throw new Error('tenant insert failed');

  const dek = generateDek();
  await db.insert(schema.tenantDeks).values({ tenantId: tenant.id, wrappedDek: wrapDek(dek) });

  await db
    .insert(schema.tenantMembers)
    .values({ tenantId: tenant.id, userId: ownerUserId, role: 'owner' });

  // start a free-plan subscription
  const planRows = await db
    .select({ id: schema.plans.id })
    .from(schema.plans)
    .where(eq(schema.plans.code, 'free'))
    .limit(1);
  if (planRows[0]) {
    await db
      .insert(schema.subscriptions)
      .values({ tenantId: tenant.id, planId: planRows[0].id, status: 'active' });
    await db
      .insert(schema.credits)
      .values({ tenantId: tenant.id, balance: 30, monthlyAllowance: 30 });
  }

  return tenant;
};

export const listMyTenants = async (userId: string) => {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.tenants.id,
      slug: schema.tenants.slug,
      displayName: schema.tenants.displayName,
      role: schema.tenantMembers.role,
    })
    .from(schema.tenantMembers)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.tenantMembers.tenantId))
    .where(
      and(
        eq(schema.tenantMembers.userId, userId),
        isNull(schema.tenantMembers.suspendedAt),
        isNull(schema.tenants.deletedAt),
      ),
    );
  return rows;
};

export const getMembership = async (tenantId: string, userId: string) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.tenantMembers)
    .where(
      and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)),
    )
    .limit(1);
  return rows[0] ?? null;
};

export const listMembers = async (tenantId: string) => {
  const db = getDb();
  return db
    .select({
      id: schema.tenantMembers.id,
      userId: schema.tenantMembers.userId,
      role: schema.tenantMembers.role,
      suspendedAt: schema.tenantMembers.suspendedAt,
      createdAt: schema.tenantMembers.createdAt,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.tenantMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.tenantMembers.userId))
    .where(eq(schema.tenantMembers.tenantId, tenantId));
};

export const countOwners = async (tenantId: string): Promise<number> => {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.tenantMembers)
    .where(
      and(
        eq(schema.tenantMembers.tenantId, tenantId),
        eq(schema.tenantMembers.role, 'owner'),
        isNull(schema.tenantMembers.suspendedAt),
      ),
    );
  return rows[0]?.count ?? 0;
};

export const setRole = async (
  tenantId: string,
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer',
): Promise<void> => {
  const db: Database = getDb();
  if (role !== 'owner') {
    const owners = await countOwners(tenantId);
    const target = await getMembership(tenantId, userId);
    if (owners <= 1 && target?.role === 'owner') {
      throw new Error('cannot demote the only owner');
    }
  }
  await db
    .update(schema.tenantMembers)
    .set({ role })
    .where(
      and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)),
    );
};

export const removeMember = async (tenantId: string, userId: string): Promise<void> => {
  const target = await getMembership(tenantId, userId);
  if (target?.role === 'owner') {
    const owners = await countOwners(tenantId);
    if (owners <= 1) throw new Error('cannot remove the only owner');
  }
  await getDb()
    .delete(schema.tenantMembers)
    .where(
      and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)),
    );
};

export const transferOwnership = async (
  tenantId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> => {
  const owners = await countOwners(tenantId);
  if (owners <= 1 && fromUserId === toUserId) return;
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.tenantMembers)
      .set({ role: 'admin' })
      .where(
        and(
          eq(schema.tenantMembers.tenantId, tenantId),
          eq(schema.tenantMembers.userId, fromUserId),
        ),
      );
    await tx
      .update(schema.tenantMembers)
      .set({ role: 'owner' })
      .where(
        and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, toUserId)),
      );
  });
};

export const softDeleteTenant = async (tenantId: string, deletedBy: string): Promise<void> => {
  const db = getDb();
  const restore = new Date(Date.now() + 7 * 86_400_000);
  await db.transaction(async (tx) => {
    await tx
      .update(schema.tenants)
      .set({ deletedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId));
    await tx.insert(schema.deletionTombstones).values({
      tenantId,
      targetTable: 'tenants',
      targetId: tenantId,
      deletedBy,
      restoreDeadline: restore,
      payload: {},
    });
  });
};

export interface TenantPatch {
  displayName?: string;
  industry?: string | null;
  countryCode?: string | null;
  brandLogoUrl?: string | null;
  brandAccentHex?: string | null;
  customDomain?: string | null;
}

export const updateTenant = async (tenantId: string, patch: TenantPatch): Promise<void> => {
  const setObj: Partial<typeof schema.tenants.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.displayName !== undefined) setObj.displayName = patch.displayName;
  if (patch.industry !== undefined) setObj.industry = patch.industry;
  if (patch.countryCode !== undefined) setObj.countryCode = patch.countryCode;
  if (patch.brandLogoUrl !== undefined) setObj.brandLogoUrl = patch.brandLogoUrl;
  if (patch.brandAccentHex !== undefined) setObj.brandAccentHex = patch.brandAccentHex;
  if (patch.customDomain !== undefined) {
    setObj.customDomain = patch.customDomain;
    setObj.customDomainVerifiedAt = null;
  }
  await getDb().update(schema.tenants).set(setObj).where(eq(schema.tenants.id, tenantId));
};

export const verifyCustomDomain = async (tenantId: string): Promise<void> => {
  await getDb()
    .update(schema.tenants)
    .set({ customDomainVerifiedAt: new Date() })
    .where(eq(schema.tenants.id, tenantId));
};

export const restoreTenant = async (tenantId: string): Promise<void> => {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(schema.tenants).set({ deletedAt: null }).where(eq(schema.tenants.id, tenantId));
    await tx
      .update(schema.deletionTombstones)
      .set({ hardDeletedAt: null })
      .where(
        and(
          eq(schema.deletionTombstones.targetTable, 'tenants'),
          eq(schema.deletionTombstones.targetId, tenantId),
        ),
      );
  });
};
