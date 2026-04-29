import { customType } from 'drizzle-orm/pg-core';

export const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea';
  },
  fromDriver(value) {
    if (value instanceof Buffer) return value;
    if (typeof value === 'string') return Buffer.from(value.replace(/^\\x/, ''), 'hex');
    return Buffer.from(value as ArrayBuffer);
  },
  toDriver(value) {
    return value;
  },
});
