import type { Logger } from 'pino';
import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    logger: Logger;
    userId: string;
    sessionId: string;
    tenantId: string;
    tenantRole: 'owner' | 'admin' | 'editor' | 'viewer' | 'stakeholder';
  }
}
