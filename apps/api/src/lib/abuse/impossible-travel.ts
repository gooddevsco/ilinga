import { getRedis } from '../redis.js';

interface RecentSignin {
  country: string;
  at: number;
}

const KEY = (userId: string): string => `il:abuse:travel:${userId}`;

/**
 * Records the country of a fresh sign-in and flags impossible travel
 * (different country within 30 minutes of the previous one).
 *
 * In production we'd geo-resolve via MaxMind. Here the caller passes the
 * country code derived from CF / Cloudflare IP headers.
 */
export const recordSignin = async (
  userId: string,
  country: string,
): Promise<{ flagged: boolean; previous?: RecentSignin }> => {
  if (process.env.NODE_ENV === 'test') {
    return { flagged: false };
  }
  const redis = getRedis();
  const key = KEY(userId);
  const raw = await redis.get(key);
  const now = Date.now();
  const next: RecentSignin = { country, at: now };
  await redis.set(key, JSON.stringify(next), 'EX', 86_400);
  if (!raw) return { flagged: false };
  const prev = JSON.parse(raw) as RecentSignin;
  const flagged = prev.country !== country && now - prev.at < 30 * 60_000;
  return { flagged, previous: prev };
};
