// Vitest setup: hydrate process.env from .env via the same loader the dev
// server uses, then force NODE_ENV=test for the test process specifically.
import '../src/env-bootstrap.js';

process.env.NODE_ENV = 'test';
