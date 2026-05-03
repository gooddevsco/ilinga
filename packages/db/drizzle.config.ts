import { defineConfig } from 'drizzle-kit';

// drizzle-kit 0.29's CJS loader can't resolve our ESM .js suffix imports
// inside src/schema/*.ts. We compile the schema to dist/ first
// (`pnpm --filter @ilinga/db build`) and point drizzle-kit at the JS output.
export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/schema/index.js',
  out: './migrations',
  dbCredentials: {
    url: process.env.IL_DB_URL ?? 'postgresql://root@localhost:26257/ilinga?sslmode=disable',
  },
  strict: true,
  verbose: true,
});
