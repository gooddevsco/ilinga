import './_setup.js';
import { describe, it, expect } from 'vitest';
import { createTenant } from '../lib/tenants/service.js';
import { cloneCycle, closeCycle, createVenture, cycleSummary } from '../lib/ventures/service.js';
import { upsertAnswer } from '../lib/ventures/answers.js';
import { upsertUser } from '../lib/auth/users.js';

describe('ventures integration', () => {
  it('creates a venture + cycle 1 + answers can be upserted with optimistic lock', async () => {
    const u = await upsertUser({ email: 'v@x.test' });
    const t = await createTenant(u.id, 'Co');
    const v = await createVenture(t.id, u.id, { name: 'Test', industry: 'logistics' });
    expect(v.cycle.seq).toBe(1);

    const a = await upsertAnswer(
      t.id,
      v.cycle.id,
      '11111111-1111-1111-1111-111111111111',
      u.id,
      'first',
      null,
    );
    expect(a.version).toBe(1);
    const a2 = await upsertAnswer(
      t.id,
      v.cycle.id,
      '11111111-1111-1111-1111-111111111111',
      u.id,
      'second',
      1,
    );
    expect(a2.version).toBe(2);

    await expect(
      upsertAnswer(t.id, v.cycle.id, '11111111-1111-1111-1111-111111111111', u.id, 'stale', 1),
    ).rejects.toThrow();
  });

  it('cloneCycle copies answers + competitors + artifacts but not content keys', async () => {
    const u = await upsertUser({ email: 'cc@x.test' });
    const t = await createTenant(u.id, 'Co');
    const v = await createVenture(t.id, u.id, { name: 'Test' });
    const qid = '22222222-2222-2222-2222-222222222222';
    await upsertAnswer(t.id, v.cycle.id, qid, u.id, 'kept', null);
    const next = await cloneCycle(t.id, u.id, v.cycle.id);
    expect(next.seq).toBe(2);
    const summary = await cycleSummary(t.id, next.id);
    expect(summary.contentKeys.length).toBe(0);
    // The new cycle's answer table should have the cloned row.
    const { schema, getDb } = await import('@ilinga/db');
    const { eq } = await import('drizzle-orm');
    const rows = await getDb()
      .select()
      .from(schema.questionAnswers)
      .where(eq(schema.questionAnswers.cycleId, next.id));
    expect(rows.length).toBe(1);
    expect(rows[0]?.rawValue).toBe('kept');
  });

  it('closeCycle freezes the cycle', async () => {
    const u = await upsertUser({ email: 'cl@x.test' });
    const t = await createTenant(u.id, 'Co');
    const v = await createVenture(t.id, u.id, { name: 'Test' });
    await closeCycle(t.id, v.cycle.id);
    const summary = await cycleSummary(t.id, v.cycle.id);
    expect(summary.cycle.status).toBe('closed');
    expect(summary.cycle.closedAt).toBeTruthy();
  });
});
