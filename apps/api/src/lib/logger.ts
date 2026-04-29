import pino from 'pino';
import { config } from '../config.js';

let instance: pino.Logger | null = null;

export const logger = (): pino.Logger => {
  if (instance) return instance;
  const cfg = config();
  instance = pino({
    level: cfg.IL_LOG_LEVEL,
    base: { service: 'ilinga-api', region: cfg.IL_REGION },
    redact: {
      paths: [
        'password',
        '*.password',
        'token',
        '*.token',
        'apiKey',
        '*.apiKey',
        'authorization',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      remove: true,
    },
    ...(cfg.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
          },
        }
      : {}),
  });
  return instance;
};
