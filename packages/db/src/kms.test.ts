import { beforeAll, describe, it, expect } from 'vitest';
import {
  decryptWithDek,
  encryptWithDek,
  generateDek,
  unwrapDek,
  wrapDek,
} from './kms.js';

describe('kms envelope encryption', () => {
  beforeAll(() => {
    process.env.IL_KMS_KEK_HEX =
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  });

  it('round-trips a wrapped DEK', () => {
    const dek = generateDek();
    expect(dek.byteLength).toBe(32);
    const wrapped = wrapDek(dek);
    const unwrapped = unwrapDek(wrapped);
    expect(unwrapped.equals(dek)).toBe(true);
  });

  it('encrypts and decrypts a string with a DEK', () => {
    const dek = generateDek();
    const ct = encryptWithDek(dek, 'sk_live_abc123');
    expect(ct.length).toBeGreaterThan(0);
    expect(decryptWithDek(dek, ct)).toBe('sk_live_abc123');
  });

  it('rejects tampered ciphertext (auth tag check)', () => {
    const dek = generateDek();
    const ct = encryptWithDek(dek, 'sensitive');
    ct[ct.length - 1] ^= 0xff;
    expect(() => decryptWithDek(dek, ct)).toThrow();
  });

  it('rejects with a wrong DEK', () => {
    const dek1 = generateDek();
    const dek2 = generateDek();
    const ct = encryptWithDek(dek1, 'secret');
    expect(() => decryptWithDek(dek2, ct)).toThrow();
  });
});
