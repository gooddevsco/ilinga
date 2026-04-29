# Ilinga

Multi-tenant SaaS platform for venture-cycle synthesis: structured interview →
content keys → AI-generated reports → stakeholder feedback. Source-of-truth
spec lives at [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## Architecture

| Tier | Tech |
| ---- | ---- |
| Web | React 19 + Vite 6 + Tailwind v4 + React Router |
| API | Hono on Node 22 + Drizzle + Zod |
| Workers | Node 22 + BullMQ (render, scan, embeddings, retention, webhooks) |
| Database | CockroachDB v24 (with pgvector) |
| Cache + queue + pubsub | Valkey 8 |
| Object storage | Cloudflare R2 (S3-compatible); MinIO locally |
| Mail | Resend (primary) + Postmark (failover); Mailpit locally |
| Workflow engine | n8n (internal-only) |
| Process manager | PM2 |
| Reverse proxy | Caddy 2 |

## Repo layout

```
apps/
  web/          React SPA (marketing + app + portal + stakeholder + admin)
  api/          Hono API
  workers/      BullMQ workers
packages/
  db/           Drizzle schema + migrations + seed
  ui/           React component primitives
  sdk/          TypeScript SDK + OpenAPI types
  emails/       MJML email templates
  eslint-config/  shared lint rules incl. no-empty-handlers
  tsconfig/     shared tsconfig bases
infra/
  caddy/        Caddyfile
  pm2/          ecosystem.config.cjs
docs/
  IMPLEMENTATION_PLAN.md   single source of truth
```

## Local development

Prereqs: Node 22, pnpm 9, Docker.

```sh
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open:

- Web: http://localhost:5173
- API: http://localhost:3001
- Mailpit: http://localhost:8025
- MinIO console: http://localhost:9001 (ilinga / ilinga-dev-secret)
- n8n: http://localhost:5678 (ilinga / ilinga)
- Cockroach UI: http://localhost:8080

## Quality gates

```sh
pnpm lint           # ESLint + custom no-empty-handlers
pnpm typecheck      # TypeScript --strict
pnpm test           # Vitest
pnpm test:integration
pnpm e2e            # Playwright
pnpm e2e:no-dead-ui # Crawls every route, fails on dead buttons/links
pnpm a11y           # axe-playwright
pnpm lighthouse
```

Every PR must pass all of the above. See §37 of the implementation plan for
phase-by-phase Definition of Done.
