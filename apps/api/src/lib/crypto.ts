import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** 32 random bytes, base64url-encoded (44 chars sans padding). */
export const generateToken = (bytes = 32): string =>
  randomBytes(bytes).toString('base64url').replace(/=+$/, '');

export const sha256Hex = (input: string | Buffer): string =>
  createHash('sha256').update(input).digest('hex');

export const sha256 = (input: string | Buffer): Buffer =>
  createHash('sha256').update(input).digest();

export const constantTimeEqualHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};

export const normaliseEmail = (raw: string): string =>
  raw.trim().toLowerCase();
