import { describe, it, expect } from 'vitest';
import { assertTenantOwns, filterByTenant, TenantScopeViolation } from './tenant-scope.js';

describe('tenant scope guard', () => {
  it('passes through a row owned by the expected tenant', () => {
    const row = { tenantId: 't1', value: 42 };
    expect(assertTenantOwns('t1', row)).toBe(row);
  });

  it('rejects a row owned by another tenant', () => {
    const row = { tenantId: 't2', value: 42 };
    expect(() => assertTenantOwns('t1', row)).toThrow(TenantScopeViolation);
  });

  it('rejects null', () => {
    expect(() => assertTenantOwns('t1', null)).toThrow(TenantScopeViolation);
  });

  it('filters cross-tenant rows out of a list', () => {
    const rows = [
      { tenantId: 't1', v: 1 },
      { tenantId: 't2', v: 2 },
      { tenantId: 't1', v: 3 },
    ];
    expect(filterByTenant('t1', rows)).toEqual([
      { tenantId: 't1', v: 1 },
      { tenantId: 't1', v: 3 },
    ]);
  });
});
