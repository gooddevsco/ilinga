import { defineConfig } from 'drizzle-kit';

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
