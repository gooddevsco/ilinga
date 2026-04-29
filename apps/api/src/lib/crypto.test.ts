import { describe, it, expect } from 'vitest';
import {
  constantTimeEqualHex,
  generateToken,
  normaliseEmail,
  sha256Hex,
} from './crypto.js';

describe('crypto', () => {
  it('generates url-safe tokens of expected length', () => {
    const t = generateToken(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThan(40);
  });

  it('hashes consistently', () => {
    const a = sha256Hex('hello');
    const b = sha256Hex('hello');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('does constant-time hex compare without NRE', () => {
    const a = sha256Hex('a');
    expect(constantTimeEqualHex(a, a)).toBe(true);
    expect(constantTimeEqualHex(a, sha256Hex('b'))).toBe(false);
    expect(constantTimeEqualHex('zz', 'aa')).toBe(false);
    expect(constantTimeEqualHex('aa', 'aaa')).toBe(false);
  });

  it('normalises email casing and whitespace', () => {
    expect(normaliseEmail('  Alice@Example.COM  ')).toBe('alice@example.com');
  });
});
