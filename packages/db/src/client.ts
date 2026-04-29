import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;

let pool: pg.Pool | null = null;
let db: Database | null = null;

export const getPool = (): pg.Pool => {
  if (pool) return pool;
  const url = process.env.IL_DB_URL;
  if (!url) throw new Error('IL_DB_URL is not set');
  pool = new pg.Pool({ connectionString: url, max: 10 });
  return pool;
};

export const getDb = (): Database => {
  if (db) return db;
  db = drizzle(getPool(), { schema });
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
};
