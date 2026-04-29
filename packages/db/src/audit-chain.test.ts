import { describe, it, expect } from 'vitest';
import { computeRowHash, verifyChainSegment } from './audit-chain.js';

const make = (i: number) => ({
  tenantId: 't1',
  actorUserId: 'u1',
  impersonatorUserId: null,
  action: 'auth.signin',
  targetTable: 'users',
  targetId: 'u1',
  payload: { i },
  createdAt: new Date('2026-01-01T00:00:00Z'),
});

describe('audit hash chain', () => {
  it('verifies an honest segment', () => {
    let prev: Buffer | null = null;
    const rows = [];
    for (let i = 0; i < 5; i += 1) {
      const base = make(i);
      const rowHash = computeRowHash(base, prev);
      rows.push({ ...base, prevHash: prev, rowHash });
      prev = rowHash;
    }
    expect(verifyChainSegment(rows)).toEqual({ ok: true });
  });

  it('detects tampering of payload', () => {
    let prev: Buffer | null = null;
    const rows = [];
    for (let i = 0; i < 3; i += 1) {
      const base = make(i);
      const rowHash = computeRowHash(base, prev);
      rows.push({ ...base, prevHash: prev, rowHash });
      prev = rowHash;
    }
    rows[1] = { ...rows[1]!, payload: { i: 999 } };
    const result = verifyChainSegment(rows);
    expect(result.ok).toBe(false);
  });

  it('detects re-ordering', () => {
    let prev: Buffer | null = null;
    const rows = [];
    for (let i = 0; i < 4; i += 1) {
      const base = make(i);
      const rowHash = computeRowHash(base, prev);
      rows.push({ ...base, prevHash: prev, rowHash });
      prev = rowHash;
    }
    [rows[1], rows[2]] = [rows[2]!, rows[1]!];
    const result = verifyChainSegment(rows);
    expect(result.ok).toBe(false);
  });
});
