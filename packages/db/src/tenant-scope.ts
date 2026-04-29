/**
 * Tenant-scope guard helpers — every query touching tenant data must pass
 * the tenantId in via this guard so we get a single chokepoint for negative
 * tests in CI (§5.1, §32.2).
 */
export class TenantScopeViolation extends Error {
  constructor(
    public readonly expectedTenantId: string,
    public readonly actualTenantId: string | null | undefined,
  ) {
    super(
      `Tenant scope violation: expected ${expectedTenantId}, got ${
        actualTenantId ?? '<null>'
      }`,
    );
    this.name = 'TenantScopeViolation';
  }
}

export const assertTenantOwns = <T extends { tenantId: string }>(
  expectedTenantId: string,
  row: T | null | undefined,
): T => {
  if (!row) {
    throw new TenantScopeViolation(expectedTenantId, null);
  }
  if (row.tenantId !== expectedTenantId) {
    throw new TenantScopeViolation(expectedTenantId, row.tenantId);
  }
  return row;
};

export const filterByTenant = <T extends { tenantId: string }>(
  expectedTenantId: string,
  rows: readonly T[],
): T[] => rows.filter((r) => r.tenantId === expectedTenantId);
