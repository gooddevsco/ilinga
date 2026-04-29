import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.IL_DB_URL ?? 'postgresql://root@localhost:26257/ilinga?sslmode=disable',
  },
  strict: true,
  verbose: true,
});
