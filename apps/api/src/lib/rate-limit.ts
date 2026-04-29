import type { MiddlewareHandler } from 'hono';
import { getRedis } from './redis.js';
import { tooManyRequests } from './problem.js';

export interface RateLimit {
  capacity: number;
  refillPerSec: number;
  scope: 'ip' | 'user' | 'tenant';
  bucket: string;
}

interface BucketState {
  tokens: number;
  updatedAtMs: number;
}

const memBuckets = new Map<string, BucketState>();

const lookupKey = (c: import('hono').Context, scope: RateLimit['scope']): string => {
  if (scope === 'user') return (c.get('userId') as string | undefined) ?? `ip:${ipOf(c)}`;
  if (scope === 'tenant') return (c.get('tenantId') as string | undefined) ?? `ip:${ipOf(c)}`;
  return `ip:${ipOf(c)}`;
};

const ipOf = (c: import('hono').Context): string => {
  const xff = c.req.header('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return c.req.header('x-real-ip') ?? 'unknown';
};

const consume = async (
  redisKey: string,
  capacity: number,
  refillPerSec: number,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> => {
  const now = Date.now();
  if (process.env.NODE_ENV === 'test') {
    const prev = memBuckets.get(redisKey) ?? { tokens: capacity, updatedAtMs: now };
    const elapsed = (now - prev.updatedAtMs) / 1000;
    const tokens = Math.min(capacity, prev.tokens + elapsed * refillPerSec);
    if (tokens < 1) {
      memBuckets.set(redisKey, { tokens, updatedAtMs: now });
      const resetMs = ((1 - tokens) / refillPerSec) * 1000;
      return { allowed: false, remaining: 0, resetMs };
    }
    memBuckets.set(redisKey, { tokens: tokens - 1, updatedAtMs: now });
    return { allowed: true, remaining: Math.floor(tokens - 1), resetMs: 0 };
  }

  const redis = getRedis();
  const lua = `
    local capacity = tonumber(ARGV[1])
    local refill = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens') or capacity)
    local last = tonumber(redis.call('HGET', KEYS[1], 'last') or now)
    local elapsed = (now - last) / 1000
    local current = math.min(capacity, tokens + elapsed * refill)
    if current < 1 then
      redis.call('HMSET', KEYS[1], 'tokens', current, 'last', now)
      redis.call('PEXPIRE', KEYS[1], 60000)
      return {0, 0}
    else
      redis.call('HMSET', KEYS[1], 'tokens', current - 1, 'last', now)
      redis.call('PEXPIRE', KEYS[1], 60000)
      return {1, math.floor(current - 1)}
    end
  `;
  const [allowed, remaining] = (await redis.eval(
    lua,
    1,
    redisKey,
    capacity.toString(),
    refillPerSec.toString(),
    now.toString(),
  )) as [number, number];
  return { allowed: allowed === 1, remaining, resetMs: 0 };
};

export const rateLimit = (limit: RateLimit): MiddlewareHandler => async (c, next) => {
  const key = `il:rl:${limit.bucket}:${lookupKey(c, limit.scope)}`;
  const result = await consume(key, limit.capacity, limit.refillPerSec);
  c.header('X-RateLimit-Limit', String(limit.capacity));
  c.header('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  if (!result.allowed) {
    if (result.resetMs) c.header('Retry-After', String(Math.ceil(result.resetMs / 1000)));
    throw tooManyRequests();
  }
  await next();
};

export const __resetMemBuckets = (): void => {
  memBuckets.clear();
};
