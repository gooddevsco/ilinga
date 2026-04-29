/**
 * RFC 7807 problem-details error envelope per docs/IMPLEMENTATION_PLAN.md §3.3.
 */
import type { Context } from 'hono';

export interface ProblemBody {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: unknown;
  request_id?: string;
}

export class HttpProblem extends Error {
  constructor(
    public readonly status: number,
    public readonly type: string,
    message: string,
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'HttpProblem';
  }
}

export const problemResponse = (c: Context, p: HttpProblem | Error): Response => {
  const reqId = c.get('requestId') as string | undefined;
  if (p instanceof HttpProblem) {
    const body: ProblemBody = {
      type: p.type,
      title: p.message,
      status: p.status,
      ...(reqId ? { request_id: reqId } : {}),
      ...p.extra,
    };
    return c.json(body, p.status as never, { 'Content-Type': 'application/problem+json' });
  }
  const body: ProblemBody = {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    ...(reqId ? { request_id: reqId } : {}),
  };
  return c.json(body, 500, { 'Content-Type': 'application/problem+json' });
};

export const badRequest = (msg: string, extra?: Record<string, unknown>) =>
  new HttpProblem(400, 'https://ilinga.com/errors/bad-request', msg, extra ?? {});
export const unauthorized = (msg = 'Unauthorized') =>
  new HttpProblem(401, 'https://ilinga.com/errors/unauthorized', msg);
export const forbidden = (msg = 'Forbidden') =>
  new HttpProblem(403, 'https://ilinga.com/errors/forbidden', msg);
export const notFound = (msg = 'Not Found') =>
  new HttpProblem(404, 'https://ilinga.com/errors/not-found', msg);
export const conflict = (msg: string, extra?: Record<string, unknown>) =>
  new HttpProblem(409, 'https://ilinga.com/errors/conflict', msg, extra ?? {});
export const preconditionFailed = (msg: string, extra?: Record<string, unknown>) =>
  new HttpProblem(412, 'https://ilinga.com/errors/precondition-failed', msg, extra ?? {});
export const tooManyRequests = (msg = 'Too Many Requests') =>
  new HttpProblem(429, 'https://ilinga.com/errors/rate-limited', msg);
