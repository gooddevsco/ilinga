import { describe, it, expect } from 'vitest';

/**
 * Phase 5 unit-tests the policy semantics that don't need a DB.
 * (Full integration of countOwners + setRole runs against Cockroach.)
 */

const isLastOwnerProtected = (
  ownerCount: number,
  targetIsOwner: boolean,
  newRole: string | null,
): boolean => {
  // null = remove
  if (!targetIsOwner) return true;
  if (newRole === 'owner') return true;
  return ownerCount > 1;
};

describe('last-owner safeguard policy', () => {
  it('allows demoting an owner when others exist', () => {
    expect(isLastOwnerProtected(2, true, 'admin')).toBe(true);
  });
  it('blocks demoting the only owner', () => {
    expect(isLastOwnerProtected(1, true, 'admin')).toBe(false);
  });
  it('blocks removing the only owner', () => {
    expect(isLastOwnerProtected(1, true, null)).toBe(false);
  });
  it('allows promoting another member to owner', () => {
    expect(isLastOwnerProtected(1, false, 'owner')).toBe(true);
  });
});
