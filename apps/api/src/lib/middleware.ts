import type { MiddlewareHandler } from 'hono';
import { ulid } from 'ulid';
import { config } from '../config.js';
import { logger } from './logger.js';
import { problemResponse, HttpProblem } from './problem.js';

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const cfg = config();
  const incoming = c.req.header(cfg.IL_REQUEST_ID_HEADER);
  const id = incoming && /^[A-Za-z0-9_-]{6,128}$/.test(incoming) ? incoming : ulid();
  c.set('requestId', id);
  c.header(cfg.IL_REQUEST_ID_HEADER, id);
  await next();
};

export const accessLogMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  const log = logger().child({ request_id: c.get('requestId') as string });
  c.set('logger', log);
  try {
    await next();
  } finally {
    const ms = Math.round(performance.now() - start);
    log.info(
      {
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        latency_ms: ms,
      },
      'request',
    );
  }
};

/**
 * Hono's compose() catches throws from sub-handlers and routes them to
 * app.onError() before any wrapping middleware's try/catch can run, so
 * errors are translated to RFC7807 problem responses via app.onError.
 * See app.ts.
 */
export const onErrorHandler = (err: Error, c: Parameters<MiddlewareHandler>[0]) => {
  const log = (c.get('logger') as ReturnType<typeof logger>) ?? logger();
  if (err instanceof HttpProblem) {
    log.warn({ err: { message: err.message, status: err.status } }, 'handled HttpProblem');
    return problemResponse(c, err);
  }
  log.error({ err }, 'unhandled error');
  return problemResponse(c, err);
};

export const securityHeadersMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
};
