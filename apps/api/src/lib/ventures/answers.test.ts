import { describe, it, expect } from 'vitest';

/**
 * Phase 6 unit-tests the optimistic-lock semantics. Full DB integration runs
 * in vitest.integration.config.ts.
 */

const checkIfMatch = (existingVersion: number, ifMatch: number | null): boolean => {
  if (ifMatch === null) return true;
  return existingVersion === ifMatch;
};

describe('answer optimistic lock', () => {
  it('passes when ifMatch is null (first write or skipped)', () => {
    expect(checkIfMatch(3, null)).toBe(true);
  });
  it('passes when ifMatch matches existing version', () => {
    expect(checkIfMatch(3, 3)).toBe(true);
  });
  it('fails when ifMatch is stale', () => {
    expect(checkIfMatch(3, 2)).toBe(false);
  });
});
