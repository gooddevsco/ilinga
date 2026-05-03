import { z } from 'zod';

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  IL_REGION: z.string().default('eu'),
  IL_DB_URL: z.string().default('postgresql://root@localhost:26257/ilinga?sslmode=disable'),
  IL_REDIS_URL: z.string().default('redis://localhost:6379'),
  IL_KMS_KEK_HEX: z.string().length(64).optional(),
  IL_WEB_ORIGIN: z.string().default('http://localhost:5173'),
  IL_API_ORIGIN: z.string().default('http://localhost:3001'),
  IL_COOKIE_DOMAIN: z.string().default('localhost'),
  IL_LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  IL_REQUEST_ID_HEADER: z.string().default('X-Request-Id'),
  IL_SESSION_TTL_HOURS: z.coerce.number().default(24),
  IL_DEVICE_TRUST_DAYS: z.coerce.number().default(30),
  IL_MAGIC_LINK_TTL_MIN: z.coerce.number().default(15),
  IL_EMAIL_PRIMARY: z.string().default('smtp'),
  IL_EMAIL_FAILOVER: z.string().default('smtp'),
  IL_EMAIL_SMTP_HOST: z.string().default('localhost'),
  IL_EMAIL_SMTP_PORT: z.coerce.number().default(1025),
  IL_EMAIL_FROM: z.string().default('Ilinga <noreply@ilinga.local>'),
  IL_EMAIL_REPLY_TO: z.string().default('team@ilinga.local'),
  GOOGLE_OAUTH_CLIENT_ID: z.string().default(''),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().default(''),
  GOOGLE_OAUTH_REDIRECT: z.string().default(''),
  HCAPTCHA_SECRET: z.string().default(''),
  IL_MAINTENANCE_BANNER: z.string().default(''),
  IL_S3_ENDPOINT: z.string().default('http://localhost:9000'),
  IL_S3_REGION: z.string().default('auto'),
  IL_S3_BUCKET: z.string().default('ilinga-eu'),
  IL_S3_ACCESS_KEY: z.string().default('ilinga'),
  IL_S3_SECRET_KEY: z.string().default('ilinga-dev-secret'),
  IL_S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('true'),
});

export type Config = z.infer<typeof Schema>;

let cached: Config | null = null;
export const config = (): Config => {
  if (cached) return cached;
  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid config: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
};
