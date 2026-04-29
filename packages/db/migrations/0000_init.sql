-- Phase 1 init migration. Source-of-truth schema lives in src/schema/*.ts;
-- subsequent migrations are produced by `pnpm db:generate`. This file
-- enables required extensions before the generated tables land.

CREATE EXTENSION IF NOT EXISTS "vector";
