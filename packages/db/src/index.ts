export * as schema from './schema/index.js';
export { getDb, getPool, closeDb, type Database } from './client.js';
export { bytea } from './types.js';
export {
  generateDek,
  wrapDek,
  unwrapDek,
  encryptWithDek,
  decryptWithDek,
} from './kms.js';
export { computeRowHash, verifyChainSegment, type AuditRowLike } from './audit-chain.js';
export { assertTenantOwns, filterByTenant, TenantScopeViolation } from './tenant-scope.js';
