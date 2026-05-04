import './env-bootstrap.js';
import { serve } from '@hono/node-server';
import { buildApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';

export const app = buildApp();

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = config();
  serve({ fetch: app.fetch, port: cfg.PORT }, (info) => {
    logger().info({ port: info.port }, 'ilinga-api listening');
  });
}
