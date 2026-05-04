import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Side-effect import: hydrate process.env from the repo-root .env so
// `pnpm dev` works without callers having to `source .env` first. Existing
// env wins over the file (CI, prod, and shell overrides take precedence).
// Skipped under NODE_ENV=production.
if (process.env.NODE_ENV !== 'production') {
  const root = resolve(import.meta.dirname, '../../..');
  const envSpecific = process.env.NODE_ENV ? [`.env.${process.env.NODE_ENV}`] : [];
  for (const candidate of [...envSpecific, '.env.local', '.env']) {
    const path = resolve(root, candidate);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}
