import './_setup.js';
import { describe, it, expect } from 'vitest';
import {
  createTenant,
  getMembership,
  listMyTenants,
  transferOwnership,
} from '../lib/tenants/service.js';
import { upsertUser } from '../lib/auth/users.js';

describe('tenants integration', () => {
  it('creates a tenant + initial owner membership + free subscription + 30 credits', async () => {
    const owner = await upsertUser({ email: 'a@b.test', displayName: 'A' });
    const t = await createTenant(owner.id, 'Test Co');
    expect(t.slug).toMatch(/^test-co/);
    const m = await getMembership(t.id, owner.id);
    expect(m?.role).toBe('owner');
    const list = await listMyTenants(owner.id);
    expect(list.find((x) => x.id === t.id)).toBeDefined();
  });

  it('transfers ownership atomically — old owner -> admin, new -> owner', async () => {
    const a = await upsertUser({ email: 'a@b.test' });
    const b = await upsertUser({ email: 'c@d.test' });
    const t = await createTenant(a.id, 'Co');
    // Add b as a member
    const { schema, getDb } = await import('@ilinga/db');
    await getDb()
      .insert(schema.tenantMembers)
      .values({ tenantId: t.id, userId: b.id, role: 'editor' });
    await transferOwnership(t.id, a.id, b.id);
    expect((await getMembership(t.id, a.id))?.role).toBe('admin');
    expect((await getMembership(t.id, b.id))?.role).toBe('owner');
  });
});
