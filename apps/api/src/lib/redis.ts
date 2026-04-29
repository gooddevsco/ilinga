import { Redis } from 'ioredis';
import { config } from '../config.js';

let primary: Redis | null = null;
let pubsub: { pub: Redis; sub: Redis } | null = null;

export const getRedis = (): Redis => {
  if (primary) return primary;
  primary = new Redis(config().IL_REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: false });
  return primary;
};

export const getPubSub = (): { pub: Redis; sub: Redis } => {
  if (pubsub) return pubsub;
  const url = config().IL_REDIS_URL;
  pubsub = {
    pub: new Redis(url, { maxRetriesPerRequest: null }),
    sub: new Redis(url, { maxRetriesPerRequest: null }),
  };
  return pubsub;
};

export const closeRedis = async (): Promise<void> => {
  await Promise.allSettled([primary?.quit(), pubsub?.pub.quit(), pubsub?.sub.quit()]);
  primary = null;
  pubsub = null;
};
