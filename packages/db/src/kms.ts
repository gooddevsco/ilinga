import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Two-tier envelope encryption per docs/IMPLEMENTATION_PLAN.md §4.1.
 *
 *   plaintext --[DEK]--> ciphertext
 *   DEK       --[KEK]--> wrapped DEK (stored on tenant_deks row)
 *
 * KEK is provided as 32 bytes hex via IL_KMS_KEK_HEX.
 * Both ciphers are AES-256-GCM. Output layout: iv(12) || authTag(16) || ct.
 */

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const DEK_LEN = 32;

const getKek = (): Buffer => {
  const hex = process.env.IL_KMS_KEK_HEX;
  if (!hex) throw new Error('IL_KMS_KEK_HEX is not set');
  if (hex.length !== 64) throw new Error('IL_KMS_KEK_HEX must be 32 bytes hex (64 chars)');
  return Buffer.from(hex, 'hex');
};

const encryptWith = (key: Buffer, plaintext: Buffer): Buffer => {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]);
};

const decryptWith = (key: Buffer, blob: Buffer): Buffer => {
  if (blob.length < IV_LEN + TAG_LEN) throw new Error('ciphertext too short');
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
};

export const generateDek = (): Buffer => randomBytes(DEK_LEN);

export const wrapDek = (dek: Buffer): Buffer => encryptWith(getKek(), dek);

export const unwrapDek = (wrapped: Buffer): Buffer => decryptWith(getKek(), wrapped);

export const encryptWithDek = (dek: Buffer, plaintext: string | Buffer): Buffer =>
  encryptWith(dek, typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext);

export const decryptWithDek = (dek: Buffer, blob: Buffer): string =>
  decryptWith(dek, blob).toString('utf8');
