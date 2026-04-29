# Ilinga.com — Implementation Plan

Multi-tenant SaaS venture analysis platform. This document is the executable plan
for the coding agent that will build Ilinga end-to-end. It is intentionally
prescriptive: file paths, table names, column names, route paths, env var names.

## Stack (locked)

- **API**: Node.js 20 LTS, TypeScript, Fastify, Drizzle ORM, CockroachDB (managed)
- **Web**: React 18 + TypeScript + Vite, TanStack Router, TanStack Query, Zustand for local UI state
- **Agents**: n8n self-hosted (PM2, internal-only on `127.0.0.1:5678`)
- **Payments**: Dodo Payments (subscriptions + one-time credit packs)
- **Reverse proxy**: Caddy 2 with auto-TLS
- **Process manager**: PM2 (cluster mode for API, fork mode for n8n)
- **Auth**: Magic link, email OTP, password + TOTP (RFC 6238), Google OAuth 2.0
- **Compliance targets**: SOC 2 Type II, GDPR, POPIA

## Phase ordering

Each phase is independently shippable. Later phases depend on earlier ones.

| Phase | Theme                                            | Sections    |
| ----- | ------------------------------------------------ | ----------- |
| 0     | Repo bootstrap + tooling                         | §1          |
| 1     | Dark theme tokens (CSS only — preserves prototype) | §15       |
| 2     | DB schema + migrations + tenant scoping          | §2, §5      |
| 3     | Auth + sessions + audit log                      | §4, §12     |
| 4     | Web app shell + legal pages                      | §1, §13, §15 |
| 5     | Tenant onboarding + venture creation             | §3          |
| 6     | Interview engine + content key extraction        | §6          |
| 7     | n8n integration + synthesis pipeline             | §7          |
| 8     | Module outputs + report renderer                 | §10         |
| 9     | Credits + Dodo Payments                          | §8          |
| 10    | BYO AI endpoints                                 | §9          |
| 11    | Templates + webhooks + admin                     | §11         |
| 12    | Compliance hardening (export, deletion, retention) | §12       |
| 13    | Deployment (Caddy, PM2, GeoDNS)                  | §14         |
| 14    | SOC 2 evidence hooks + load test                 | §12         |

---

## §1 Repository structure

Monorepo using pnpm workspaces + Turborepo.

```
ilinga/
├── apps/
│   ├── api/                          # Fastify API (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts              # bootstrap, plugin registration
│   │   │   ├── env.ts                # zod-validated env
│   │   │   ├── plugins/              # fastify plugins (auth, tenant, audit, rate-limit)
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # routes, service, magic-link, otp, totp, oauth
│   │   │   │   ├── tenants/
│   │   │   │   ├── users/
│   │   │   │   ├── ventures/
│   │   │   │   ├── interviews/
│   │   │   │   ├── synthesis/
│   │   │   │   ├── outputs/
│   │   │   │   ├── reports/
│   │   │   │   ├── credits/
│   │   │   │   ├── ai-endpoints/
│   │   │   │   ├── templates/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── admin/
│   │   │   │   └── audit/
│   │   │   ├── lib/                  # crypto, kms, email, pdf, handlebars-sandbox
│   │   │   ├── workers/              # bullmq workers (pdf render, webhook delivery)
│   │   │   └── n8n/                  # n8n callback handlers + outbound triggers
│   │   ├── test/                     # vitest
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/                          # React app (port 5173 dev / static dist in prod)
│       ├── src/
│       │   ├── main.tsx
│       │   ├── router.tsx
│       │   ├── routes/               # file-based routes (TanStack Router)
│       │   │   ├── _public/          # marketing landing, legal
│       │   │   ├── _auth/            # sign-in, sign-up, magic-link callback
│       │   │   └── _app/             # authenticated shell
│       │   │       ├── dashboard/
│       │   │       ├── venture/
│       │   │       ├── interview/
│       │   │       ├── synthesis/
│       │   │       ├── outputs/
│       │   │       ├── reports/
│       │   │       ├── credits/
│       │   │       └── settings/
│       │   ├── components/           # shadcn-style primitives + app components
│       │   ├── features/             # feature-scoped components, hooks, queries
│       │   ├── styles/
│       │   │   ├── tokens.css        # design tokens (light + dark)
│       │   │   └── globals.css
│       │   └── lib/                  # api client, query keys, formatters
│       ├── public/
│       └── index.html
├── packages/
│   ├── shared-types/                 # request/response zod schemas, shared enums
│   │   └── src/
│   │       ├── auth.ts
│   │       ├── ventures.ts
│   │       ├── interviews.ts
│   │       ├── reports.ts
│   │       └── index.ts
│   ├── db/                           # Drizzle schema, migrations, seed scripts
│   │   ├── src/
│   │   │   ├── schema/               # one file per domain
│   │   │   │   ├── tenants.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── ventures.ts
│   │   │   │   ├── interviews.ts
│   │   │   │   ├── content-keys.ts
│   │   │   │   ├── prompts.ts
│   │   │   │   ├── reports.ts
│   │   │   │   ├── credits.ts
│   │   │   │   ├── webhooks.ts
│   │   │   │   ├── audit.ts
│   │   │   │   └── index.ts          # re-export
│   │   │   ├── client.ts             # drizzle client factory
│   │   │   └── tenant-scope.ts       # query middleware
│   │   ├── migrations/               # drizzle-kit output
│   │   ├── seed/
│   │   │   ├── system-clusters.ts
│   │   │   ├── system-modules.ts
│   │   │   ├── system-prompts.ts
│   │   │   └── system-report-types.ts
│   │   └── drizzle.config.ts
│   └── eslint-config/                # shared eslint + prettier
├── infra/
│   ├── caddy/Caddyfile
│   ├── pm2/ecosystem.config.cjs
│   ├── n8n/
│   │   ├── workflows/                # exported n8n workflow JSON
│   │   └── README.md
│   └── systemd/                      # optional: PM2 startup unit
├── docs/
│   ├── IMPLEMENTATION_PLAN.md        # this file
│   ├── ARCHITECTURE.md
│   ├── RUNBOOK.md
│   └── SOC2_CONTROLS.md
├── .github/workflows/                # CI: typecheck, lint, test, build
├── .env.example
├── package.json                      # root, pnpm workspaces
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

### Key root config

- `pnpm-workspace.yaml`: `packages: [apps/*, packages/*]`
- `turbo.json`: pipelines `build`, `lint`, `typecheck`, `test`, with `db#generate` upstream of API build
- `tsconfig.base.json`: strict, `paths` aliasing `@ilinga/db`, `@ilinga/shared-types`
- Node 20 pinned via `.nvmrc`; pnpm 9 pinned via `packageManager`
- Conventional commits enforced via `commitlint` + Husky

---

## §2 Database schema (Drizzle + CockroachDB)

CockroachDB notes:
- All PKs are `UUID` (`gen_random_uuid()`). Avoid sequential IDs.
- Use `STRING` (Cockroach treats `VARCHAR`/`TEXT` as `STRING`).
- Use `TIMESTAMPTZ` everywhere.
- Index `(tenant_id, ...)` first on every secondary index — see §5.
- Use `INTERLEAVE` only where strictly necessary; default to FK + composite indexes.
- Soft delete via `deleted_at TIMESTAMPTZ` on user-facing tables; hard-delete via background job after retention window.

Drizzle file map: `packages/db/src/schema/<domain>.ts`. One enum file `enums.ts` re-exported.

### 2.1 Tenants & plans

`tenants`
- `id UUID PK`
- `name STRING NOT NULL`
- `slug STRING UNIQUE NOT NULL`              -- subdomain on customer-facing portals
- `display_logo_url STRING`
- `region STRING NOT NULL DEFAULT 'eu'`       -- `eu` | `us` | `za` (POPIA)
- `data_residency STRING NOT NULL DEFAULT 'eu'`
- `tone_preset STRING DEFAULT 'mckinsey'`     -- feeds {{tenant.tone}}
- `customer_portal_enabled BOOL DEFAULT false`
- `customer_portal_domain STRING`             -- wildcard *.tenant.com → Caddy on-demand TLS
- `created_at`, `updated_at`, `deleted_at`

`tenant_plans`
- `id UUID PK`
- `tenant_id UUID FK → tenants.id`
- `plan_code STRING NOT NULL`                 -- `free`, `studio`, `pro`, `firm`
- `monthly_credit_allowance INT NOT NULL`
- `seat_limit INT NOT NULL`
- `features JSONB NOT NULL DEFAULT '{}'`      -- feature flags per plan
- `effective_from TIMESTAMPTZ NOT NULL`
- `effective_to TIMESTAMPTZ`                  -- null = current
- `dodo_subscription_id STRING`
- index `(tenant_id, effective_to)` for "current plan" lookups

`tenant_ai_endpoints`
- `id UUID PK`
- `tenant_id UUID FK`
- `provider STRING NOT NULL`                  -- `openai|azure|anthropic|bedrock|vertex|ollama|openai_compat`
- `display_name STRING NOT NULL`
- `model_id STRING NOT NULL`
- `endpoint_url STRING`
- `api_key_ciphertext BYTES NOT NULL`         -- AES-256-GCM
- `api_key_iv BYTES NOT NULL`
- `api_key_tag BYTES NOT NULL`
- `kms_key_id STRING NOT NULL`                -- per-tenant DEK reference
- `status STRING NOT NULL DEFAULT 'unverified'` -- `unverified|connected|error`
- `last_test_at TIMESTAMPTZ`
- `last_error STRING`
- `is_primary BOOL DEFAULT false`
- `created_at`, `updated_at`, `deleted_at`
- unique partial index `(tenant_id) WHERE is_primary AND deleted_at IS NULL`

`tenant_ai_routing`
- `tenant_id UUID PK part`
- `workload STRING PK part`                   -- `interview_followup|module_synthesis|cross_module_reduce|report_render|embeddings`
- `endpoint_id UUID FK → tenant_ai_endpoints.id`
- `fallback_endpoint_id UUID NULL`            -- system endpoint allowed
- `updated_at`

### 2.2 Users, sessions, MFA

`users`
- `id UUID PK`
- `email CITEXT UNIQUE NOT NULL`              -- Cockroach: use `STRING` + functional unique index `lower(email)`
- `email_verified_at TIMESTAMPTZ`
- `display_name STRING`
- `avatar_url STRING`
- `password_hash STRING`                      -- argon2id; nullable for passwordless-only users
- `password_updated_at TIMESTAMPTZ`
- `default_tenant_id UUID FK → tenants.id`
- `locale STRING DEFAULT 'en'`
- `created_at`, `updated_at`, `deleted_at`

`user_sessions`
- `id UUID PK`
- `user_id UUID FK`
- `tenant_id UUID FK NULL`                    -- active tenant context
- `token_hash STRING NOT NULL`                -- sha-256 of opaque token (cookie value)
- `device_label STRING`
- `device_trusted_until TIMESTAMPTZ`           -- 30-day remember-this-device
- `ip INET`
- `user_agent STRING`
- `expires_at TIMESTAMPTZ NOT NULL`
- `revoked_at TIMESTAMPTZ`
- `created_at`
- index `(user_id, revoked_at)`, `(token_hash)`

`user_mfa`
- `user_id UUID PK`
- `totp_secret_ciphertext BYTES`              -- encrypted with platform KMS
- `totp_secret_iv BYTES`
- `totp_secret_tag BYTES`
- `totp_enabled_at TIMESTAMPTZ`
- `recovery_codes_hash JSONB`                 -- array of sha-256
- `last_used_at TIMESTAMPTZ`

`user_magic_links`
- `id UUID PK`
- `user_id UUID FK`                            -- nullable (link can pre-create user)
- `email STRING NOT NULL`
- `token_hash STRING UNIQUE NOT NULL`
- `purpose STRING NOT NULL`                   -- `signin|signup|tenant_invite`
- `tenant_invite_id UUID NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `consumed_at TIMESTAMPTZ`
- `created_at`, `ip INET`, `user_agent STRING`
- index `(token_hash)`, `(email, purpose, consumed_at)`

`user_email_otps`
- `id UUID PK`
- `email STRING NOT NULL`
- `code_hash STRING NOT NULL`                 -- bcrypt(6-digit + salt)
- `purpose STRING NOT NULL`                   -- `signin|step_up|email_change`
- `attempts INT DEFAULT 0`
- `expires_at TIMESTAMPTZ NOT NULL`            -- 10 min
- `consumed_at TIMESTAMPTZ`
- `created_at`
- index `(email, purpose, consumed_at)`

`user_oauth_identities`
- `id UUID PK`
- `user_id UUID FK`
- `provider STRING NOT NULL`                   -- `google`
- `subject STRING NOT NULL`                    -- provider sub
- `email STRING`
- `created_at`
- unique `(provider, subject)`

### 2.3 Tenant membership

`tenant_members`
- `tenant_id UUID PK part`
- `user_id UUID PK part`
- `role STRING NOT NULL`                       -- `owner|admin|editor|viewer`
- `seat_status STRING NOT NULL DEFAULT 'active'` -- `active|suspended`
- `joined_at TIMESTAMPTZ`
- `created_at`, `updated_at`

`tenant_invitations`
- `id UUID PK`
- `tenant_id UUID FK`
- `email STRING NOT NULL`
- `role STRING NOT NULL`
- `invited_by UUID FK → users.id`
- `magic_link_id UUID FK NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `accepted_at TIMESTAMPTZ`
- `revoked_at TIMESTAMPTZ`
- `created_at`
- unique partial `(tenant_id, lower(email)) WHERE accepted_at IS NULL AND revoked_at IS NULL`

### 2.4 Ventures, cycles, briefs, artifacts

`ventures`
- `id UUID PK`
- `tenant_id UUID FK NOT NULL`
- `name STRING NOT NULL`                       -- {{venture.name}}
- `slug STRING NOT NULL`                       -- unique within tenant
- `industry STRING`                            -- nullable, AI-determined if blank
- `industry_source STRING DEFAULT 'ai'`        -- `ai|user`
- `geo_primary STRING NOT NULL`                -- ISO-3166 country (or `multi`)
- `geo_secondary JSONB DEFAULT '[]'`           -- additional regions
- `wedge STRING`                               -- {{venture.wedge}} short label
- `created_by UUID FK → users.id`
- `created_at`, `updated_at`, `deleted_at`
- unique `(tenant_id, slug)`

`venture_cycles`
- `id UUID PK`
- `tenant_id UUID FK`
- `venture_id UUID FK`
- `cycle_number INT NOT NULL`                  -- 1, 2, 3 ...
- `status STRING NOT NULL`                     -- `briefing|interviewing|synthesizing|reporting|closed`
- `started_at TIMESTAMPTZ`
- `closed_at TIMESTAMPTZ`
- `auto_delete_artifacts_at TIMESTAMPTZ`        -- 90d after close, configurable
- unique `(venture_id, cycle_number)`

`venture_briefs`
- `id UUID PK`
- `cycle_id UUID FK`
- `tenant_id UUID FK`
- `summary STRING NOT NULL`                    -- {{venture.brief}}
- `target_audience STRING`
- `goals JSONB`
- `submitted_at TIMESTAMPTZ`

`venture_artifacts`
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `kind STRING NOT NULL`                       -- `pdf|deck|doc|spreadsheet|image|url`
- `original_filename STRING`
- `storage_key STRING NOT NULL`                -- S3-compatible object key
- `mime_type STRING`
- `size_bytes BIGINT`
- `sha256 STRING`
- `extracted_text_excerpt STRING`               -- first 4kb for previews
- `signal_count INT DEFAULT 0`                  -- how many content keys derived
- `uploaded_by UUID FK → users.id`
- `uploaded_at TIMESTAMPTZ`
- `purged_at TIMESTAMPTZ`

`venture_competitors`
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `url STRING NOT NULL`
- `display_name STRING`
- `tier STRING`                                -- `lead|fast_follower|niche` (AI-classified)
- `scrape_status STRING NOT NULL DEFAULT 'pending'` -- `pending|scraping|done|failed`
- `scraped_at TIMESTAMPTZ`
- `summary STRING`                              -- AI-extracted competitor summary
- `parity_scores JSONB`                         -- {axis: score} normalised 1-5
- index `(cycle_id, tier)`

### 2.5 Clusters, modules, questions

System-defined clusters & modules are seeded; tenants can override per venture.

`clusters`
- `id UUID PK`
- `tenant_id UUID NULL`                        -- NULL = system cluster
- `code STRING NOT NULL`                       -- `positioning|market_tam|competition|gtm|product_strategy|unit_economics|risk_compliance|team_capital`
- `display_name STRING NOT NULL`
- `order_index INT NOT NULL`
- `is_active BOOL DEFAULT true`
- unique `(COALESCE(tenant_id, '00000000-...'), code)`

`modules`
- `id UUID PK`
- `tenant_id UUID NULL`
- `cluster_id UUID FK`
- `code STRING NOT NULL`                       -- `audience|promise|proof|sizing|segments|geography|direct|indirect|substitutes|channels|...`
- `display_name STRING NOT NULL`
- `order_index INT NOT NULL`
- `synthesis_prompt_id UUID FK → prompts.id`   -- the canonical prompt
- `confidence_threshold FLOAT DEFAULT 0.6`
- `credit_cost INT DEFAULT 0`                  -- synthesis cost
- `is_active BOOL DEFAULT true`

`questions`
- `id UUID PK`
- `tenant_id UUID NULL`
- `module_id UUID FK`
- `code STRING NOT NULL`                       -- e.g. `Q3.4`
- `prompt_text STRING NOT NULL`
- `prompt_subtext STRING`
- `hints JSONB DEFAULT '[]'`                   -- string array
- `order_index INT NOT NULL`
- `min_chars INT DEFAULT 0`
- `is_required BOOL DEFAULT true`
- `extracts_keys JSONB DEFAULT '[]'`           -- array of content_key codes this question fills

`question_answers`
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `question_id UUID FK`
- `answered_by UUID FK → users.id`
- `answer_text STRING`
- `answer_payload JSONB`                       -- structured answers (multi-choice, scales)
- `confidence_score FLOAT`                     -- self-rated or AI-derived
- `submitted_at TIMESTAMPTZ`
- `superseded_at TIMESTAMPTZ`                   -- previous version when answer is edited
- index `(cycle_id, question_id, superseded_at)`

`question_followups`                           -- agent-generated follow-up questions
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `parent_question_id UUID FK → questions.id`
- `parent_answer_id UUID FK → question_answers.id`
- `prompt_text STRING NOT NULL`
- `status STRING NOT NULL`                     -- `queued|asked|answered|skipped`
- `created_at`

### 2.6 Content keys (the core domain)

`content_key_definitions`                      -- system + tenant-defined catalog
- `id UUID PK`
- `tenant_id UUID NULL`
- `code STRING NOT NULL`                       -- `venture.name`, `competitor.lead`, `parity.matrix`, ...
- `display_label STRING`
- `value_type STRING NOT NULL`                 -- `string|number|json|markdown|enum|matrix`
- `enum_options JSONB`
- `is_derived BOOL DEFAULT false`               -- produced by prompt rather than question
- unique `(COALESCE(tenant_id, '00000000-...'), code)`

`question_content_key_mappings`
- `question_id UUID FK PK part`
- `content_key_code STRING PK part`
- `extractor STRING NOT NULL`                  -- `direct|regex|llm_extract|json_path`
- `extractor_config JSONB`                     -- e.g. regex pattern, llm extraction prompt
- `priority INT DEFAULT 100`                   -- lower wins on conflict

`content_keys`                                  -- per-cycle resolved store
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `code STRING NOT NULL`
- `value_text STRING`
- `value_json JSONB`
- `source STRING NOT NULL`                     -- `interview|artifact|prompt_run|manual|stakeholder`
- `source_ref UUID`                             -- answer_id | prompt_run_id | artifact_id
- `version INT NOT NULL DEFAULT 1`
- `confidence FLOAT`
- `superseded_at TIMESTAMPTZ`
- `created_at`
- unique `(cycle_id, code, version)`
- index `(cycle_id, code, superseded_at)` for "current value" lookup

### 2.7 Prompts (admin-designed, versioned)

`prompts`
- `id UUID PK`
- `tenant_id UUID NULL`                        -- NULL = system prompt
- `code STRING NOT NULL`                       -- e.g. `competition.direct`
- `version INT NOT NULL`
- `module_id UUID FK NULL`
- `report_type_id UUID FK NULL`
- `purpose STRING NOT NULL`                    -- `module_synthesis|report_section|interview_followup|reducer`
- `template STRING NOT NULL`                   -- raw with {{key}} placeholders
- `output_keys JSONB NOT NULL`                  -- array of content key codes the prompt produces
- `required_keys JSONB NOT NULL`                -- inputs the template references
- `model_constraints JSONB`                    -- {temperature, max_tokens, json_mode}
- `credit_cost INT DEFAULT 0`
- `is_active BOOL DEFAULT true`
- `created_by UUID FK`
- `created_at`
- unique `(COALESCE(tenant_id,'00000000-...'), code, version)`

`prompt_runs`
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `prompt_id UUID FK`
- `prompt_version INT NOT NULL`
- `input_keys_snapshot JSONB NOT NULL`          -- materialised key values at run time
- `output_text STRING`
- `output_json JSONB`
- `output_keys_written JSONB`                   -- array of content_key ids written
- `endpoint_id UUID FK → tenant_ai_endpoints.id NULL`
- `model_id STRING`
- `tokens_in INT`
- `tokens_out INT`
- `credits_charged INT`
- `latency_ms INT`
- `status STRING NOT NULL`                     -- `queued|running|done|failed`
- `error STRING`
- `started_at`, `completed_at`
- index `(cycle_id, prompt_id, started_at)`

### 2.8 Reports

`report_types`
- `id UUID PK`
- `tenant_id UUID NULL`
- `code STRING NOT NULL`                       -- `snapshot|competitive_landscape|gtm_playbook|investor_brief|...`
- `display_name STRING NOT NULL`
- `tier STRING NOT NULL`                       -- `free|pro|premium`
- `credit_cost INT NOT NULL`
- `description STRING`
- `feeder_module_codes JSONB NOT NULL`          -- array of module codes
- `default_template_id UUID FK → report_templates.id`
- `is_active BOOL DEFAULT true`

`report_templates`
- `id UUID PK`
- `tenant_id UUID NULL`                        -- NULL = system
- `report_type_id UUID FK`
- `name STRING NOT NULL`
- `format STRING NOT NULL DEFAULT 'handlebars_html'`
- `body STRING NOT NULL`                        -- handlebars HTML
- `assets_manifest JSONB`                       -- referenced fonts/images
- `version INT NOT NULL DEFAULT 1`
- `is_default BOOL DEFAULT false`
- `created_by UUID FK`
- `created_at`

`report_renders`
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK`
- `report_type_id UUID FK`
- `template_id UUID FK`
- `template_version INT NOT NULL`
- `content_keys_snapshot JSONB NOT NULL`        -- frozen key store at render time
- `html_storage_key STRING`
- `pdf_storage_key STRING`
- `pdf_sha256 STRING`
- `credits_charged INT NOT NULL`
- `is_rerender BOOL DEFAULT false`               -- rerender within same cycle = free
- `requested_by UUID FK`
- `status STRING NOT NULL`                      -- `queued|rendering|done|failed`
- `error STRING`
- `created_at`, `completed_at`

`report_share_links`
- `id UUID PK`
- `tenant_id UUID FK`
- `render_id UUID FK`
- `token_hash STRING UNIQUE NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `revoked_at TIMESTAMPTZ`
- `download_count INT DEFAULT 0`
- `password_hash STRING`                         -- optional access password
- `created_by UUID FK`
- `created_at`

### 2.9 Credits & subscriptions

`subscription_plans`                             -- catalog (system-managed)
- `id UUID PK`
- `code STRING UNIQUE NOT NULL`                 -- `free|studio|pro|firm`
- `display_name STRING`
- `monthly_price_cents INT`
- `monthly_credits INT`
- `seat_limit INT`
- `dodo_product_id STRING`
- `features JSONB`
- `is_active BOOL DEFAULT true`

`tenant_subscriptions`
- `id UUID PK`
- `tenant_id UUID FK`
- `plan_code STRING NOT NULL`
- `dodo_subscription_id STRING UNIQUE`
- `dodo_customer_id STRING`
- `status STRING NOT NULL`                      -- `trialing|active|past_due|canceled|paused`
- `current_period_start TIMESTAMPTZ`
- `current_period_end TIMESTAMPTZ`
- `cancel_at TIMESTAMPTZ`
- `last_synced_at TIMESTAMPTZ`
- index `(tenant_id, status)`

`credit_packs`                                   -- catalog
- `id UUID PK`
- `code STRING UNIQUE`
- `credits INT NOT NULL`
- `price_cents INT NOT NULL`
- `dodo_product_id STRING`
- `is_active BOOL DEFAULT true`

`credit_ledger`                                  -- append-only
- `id UUID PK`
- `tenant_id UUID FK`
- `delta INT NOT NULL`                          -- positive credit, negative debit
- `balance_after INT NOT NULL`                  -- denormalised running balance
- `reason STRING NOT NULL`                      -- `monthly_allowance|topup|render|resynth|refund|adjustment`
- `ref_table STRING`
- `ref_id UUID`
- `dodo_event_id STRING`                        -- idempotency
- `actor_user_id UUID FK NULL`
- `note STRING`
- `created_at`
- unique `(dodo_event_id) WHERE dodo_event_id IS NOT NULL`
- index `(tenant_id, created_at DESC)`

`credit_balances`                                -- materialised current balance for fast reads
- `tenant_id UUID PK`
- `balance INT NOT NULL`
- `monthly_allowance INT NOT NULL`
- `period_burn INT NOT NULL DEFAULT 0`
- `period_resets_at TIMESTAMPTZ`
- `updated_at`

### 2.10 Webhooks

`webhooks`                                       -- tenant outbound
- `id UUID PK`
- `tenant_id UUID FK`
- `url STRING NOT NULL`
- `secret_ciphertext BYTES NOT NULL`
- `secret_iv BYTES`, `secret_tag BYTES`, `kms_key_id STRING`
- `events JSONB NOT NULL`                       -- ['cycle.closed', 'report.rendered', ...]
- `is_active BOOL DEFAULT true`
- `created_at`

`webhook_deliveries`
- `id UUID PK`
- `tenant_id UUID FK`
- `webhook_id UUID FK`
- `event STRING NOT NULL`
- `payload JSONB NOT NULL`
- `attempt INT NOT NULL DEFAULT 1`
- `next_attempt_at TIMESTAMPTZ`
- `status STRING NOT NULL`                      -- `pending|delivered|failed|exhausted`
- `response_status INT`
- `response_body_excerpt STRING`
- `created_at`, `delivered_at`
- index `(status, next_attempt_at)`

### 2.11 n8n integration

`n8n_jobs`                                       -- our view of work dispatched to n8n
- `id UUID PK`
- `tenant_id UUID FK`
- `cycle_id UUID FK NULL`
- `kind STRING NOT NULL`                        -- `interview_followup|module_synthesis|cross_module_reduce|report_render`
- `payload JSONB NOT NULL`
- `n8n_execution_id STRING`
- `status STRING NOT NULL`                      -- `queued|running|done|failed|cancelled`
- `attempts INT DEFAULT 0`
- `last_error STRING`
- `started_at`, `completed_at`, `created_at`
- index `(status, kind, created_at)`

### 2.12 Audit & compliance

`audit_log`                                      -- append-only, retention 7y
- `id UUID PK`
- `tenant_id UUID NULL`                         -- NULL for platform-level events
- `actor_user_id UUID NULL`
- `actor_type STRING NOT NULL`                  -- `user|system|webhook|n8n|admin`
- `action STRING NOT NULL`                      -- `tenant.create|user.invite|cycle.close|...`
- `target_table STRING`
- `target_id UUID`
- `before JSONB`
- `after JSONB`
- `ip INET`
- `user_agent STRING`
- `request_id STRING`
- `created_at`
- index `(tenant_id, created_at DESC)`, `(actor_user_id, created_at DESC)`

`data_export_jobs`
- `id UUID PK`, `tenant_id UUID FK`, `requested_by UUID FK`
- `status STRING`, `download_storage_key STRING`, `expires_at TIMESTAMPTZ`
- `created_at`, `completed_at`

`data_deletion_jobs`
- `id UUID PK`, `tenant_id UUID FK`, `requested_by UUID FK`
- `scope STRING`                                -- `tenant|user|cycle|artifact`
- `target_id UUID`
- `status STRING`, `dry_run BOOL`
- `summary JSONB`                                -- counts of deleted rows by table
- `created_at`, `completed_at`

### 2.13 Stakeholder feedback loops

`stakeholder_invites`
- `id UUID PK`, `tenant_id UUID FK`, `cycle_id UUID FK`
- `email STRING`, `display_name STRING`, `relation STRING`     -- `customer|investor|advisor`
- `token_hash STRING UNIQUE`, `expires_at TIMESTAMPTZ`
- `scope JSONB`                                                  -- which questions/reports they can see
- `created_by UUID FK`, `created_at`

`stakeholder_responses`
- `id UUID PK`, `tenant_id UUID FK`, `cycle_id UUID FK`
- `invite_id UUID FK`, `question_id UUID FK NULL`, `report_render_id UUID FK NULL`
- `answer_text STRING`, `answer_payload JSONB`, `submitted_at TIMESTAMPTZ`

---

## §3 API design

Conventions:
- Base URL `https://api.ilinga.com/v1`
- All authenticated routes require `Cookie: il_session=...` (httpOnly, Secure, SameSite=Lax) **and** an `X-Il-Tenant: <tenant_id>` header on tenant-scoped routes (server validates membership).
- All write endpoints require `X-Il-Csrf` token (double-submit cookie pattern).
- All responses follow `{ data, error, meta }` envelope. Errors: `{ error: { code, message, fields? } }`.
- Idempotency: write endpoints accept `Idempotency-Key` header; results cached 24h.
- Pagination: cursor-based, `?cursor=...&limit=50`.
- Zod schemas in `packages/shared-types` are the single source of truth; API and Web both import them.

### 3.1 Auth (`/auth`)

| Method | Path                                | Purpose                                                |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| POST   | `/auth/magic-link/request`          | body: `{email, purpose}` → email sent, 200 always      |
| POST   | `/auth/magic-link/verify`           | body: `{token}` → session cookie + user object         |
| POST   | `/auth/otp/request`                 | body: `{email, purpose}`                                |
| POST   | `/auth/otp/verify`                  | body: `{email, code, purpose}` → session                |
| POST   | `/auth/password/login`              | body: `{email, password}` → session OR `mfa_required`   |
| POST   | `/auth/password/set`                | body: `{current_password?, new_password}` (auth)        |
| POST   | `/auth/password/forgot`             | triggers magic-link (purpose=`password_reset`)         |
| GET    | `/auth/google/start`                | 302 to Google with state cookie                         |
| GET    | `/auth/google/callback`             | exchange code → upsert user → session                   |
| POST   | `/auth/totp/setup/init`             | returns provisioning URI + base32 secret                |
| POST   | `/auth/totp/setup/verify`           | body: `{code}` → enables TOTP, returns recovery codes   |
| POST   | `/auth/totp/verify`                 | body: `{code OR recovery_code}` (step-up)               |
| POST   | `/auth/totp/disable`                | requires step-up                                        |
| GET    | `/auth/sessions`                    | list current user's sessions                            |
| DELETE | `/auth/sessions/:id`                | revoke a session                                        |
| POST   | `/auth/logout`                      | revoke current session                                  |
| POST   | `/auth/device/trust`                | mark current device trusted for 30 days                 |
| GET    | `/auth/me`                          | current user, default tenant, memberships               |

Rate limits (per IP and per email): magic link 5/min, OTP 3/min, password 5/min/15min lockout after 10 fails.

### 3.2 Tenants (`/tenants`)

| Method | Path                                | Purpose                                            |
| ------ | ----------------------------------- | -------------------------------------------------- |
| POST   | `/tenants`                          | create + assign creating user as `owner`            |
| GET    | `/tenants/:id`                      | fetch                                               |
| PATCH  | `/tenants/:id`                      | name, logo, region, tone preset                     |
| GET    | `/tenants/:id/plan`                 | current `tenant_plans` row                           |
| POST   | `/tenants/:id/plan/switch`          | start Dodo checkout for plan change                  |
| GET    | `/tenants/:id/usage`                | seats used, credits used, burn/day                   |
| POST   | `/tenants/:id/customer-portal`      | enable wildcard customer-facing portal               |

### 3.3 Team (`/tenants/:id/members`, `/invitations`)

| Method | Path                                              | Purpose                |
| ------ | ------------------------------------------------- | ---------------------- |
| GET    | `/tenants/:id/members`                            | list                   |
| PATCH  | `/tenants/:id/members/:userId`                    | role change             |
| DELETE | `/tenants/:id/members/:userId`                    | remove + free seat     |
| POST   | `/tenants/:id/invitations`                        | invite (enforces seat limit) |
| GET    | `/tenants/:id/invitations`                        | list pending           |
| DELETE | `/tenants/:id/invitations/:inviteId`              | revoke                 |
| POST   | `/invitations/:token/accept`                      | accept invite (auth)   |

### 3.4 Ventures & cycles (`/tenants/:tid/ventures`)

| Method | Path                                                            | Purpose                            |
| ------ | --------------------------------------------------------------- | ---------------------------------- |
| POST   | `/tenants/:tid/ventures`                                        | create venture                     |
| GET    | `/tenants/:tid/ventures`                                        | list                               |
| GET    | `/tenants/:tid/ventures/:vid`                                   | fetch                              |
| PATCH  | `/tenants/:tid/ventures/:vid`                                   | name, industry, geo                |
| DELETE | `/tenants/:tid/ventures/:vid`                                   | soft delete                        |
| POST   | `/tenants/:tid/ventures/:vid/cycles`                            | start a new cycle                  |
| POST   | `/tenants/:tid/ventures/:vid/cycles/:cid/close`                 | close cycle (locks edits, schedules artifact purge) |
| GET    | `/tenants/:tid/ventures/:vid/cycles/:cid`                       | full cycle status                  |
| POST   | `/tenants/:tid/ventures/:vid/cycles/:cid/brief`                 | submit/update brief                |
| POST   | `/tenants/:tid/ventures/:vid/cycles/:cid/competitors`           | add competitor URL (queues scrape) |
| GET    | `/tenants/:tid/ventures/:vid/cycles/:cid/competitors`           | list                               |
| DELETE | `/tenants/:tid/ventures/:vid/cycles/:cid/competitors/:coid`     | remove                             |
| POST   | `/tenants/:tid/ventures/:vid/cycles/:cid/artifacts/upload-url`  | returns S3 presigned PUT           |
| POST   | `/tenants/:tid/ventures/:vid/cycles/:cid/artifacts/finalize`    | record uploaded artifact           |
| GET    | `/tenants/:tid/ventures/:vid/cycles/:cid/artifacts`             | list                               |
| DELETE | `/tenants/:tid/ventures/:vid/cycles/:cid/artifacts/:aid`        | purge                              |

### 3.5 Interview (`/cycles/:cid/interview`)

| Method | Path                                            | Purpose                                |
| ------ | ----------------------------------------------- | -------------------------------------- |
| GET    | `/cycles/:cid/interview/progress`               | progress map: clusters → modules → q's |
| GET    | `/cycles/:cid/interview/next`                   | next unanswered question (incl. follow-ups) |
| POST   | `/cycles/:cid/interview/answers`                | submit answer; triggers extraction + n8n followup |
| PATCH  | `/cycles/:cid/interview/answers/:aid`           | edit answer (creates new version)       |
| POST   | `/cycles/:cid/interview/answers/:aid/skip`      | mark skipped                           |
| GET    | `/cycles/:cid/interview/followups`              | pending follow-ups                      |
| POST   | `/cycles/:cid/interview/followups/:fid/answer`  | answer a follow-up                      |

### 3.6 Synthesis (`/cycles/:cid/synthesis`)

| Method | Path                                                | Purpose                                      |
| ------ | --------------------------------------------------- | -------------------------------------------- |
| POST   | `/cycles/:cid/synthesis/run`                        | trigger pipeline (cluster or full)           |
| GET    | `/cycles/:cid/synthesis/status`                     | current stage, queued jobs                    |
| GET    | `/cycles/:cid/synthesis/keys`                       | live content key store                        |
| GET    | `/cycles/:cid/synthesis/keys/:code`                 | history of versions for one key               |
| POST   | `/cycles/:cid/synthesis/modules/:mid/resynthesize`  | re-run one module (charges credits)           |

### 3.7 Module outputs (`/cycles/:cid/modules`)

| Method | Path                                          | Purpose                          |
| ------ | --------------------------------------------- | -------------------------------- |
| GET    | `/cycles/:cid/modules`                        | list with confidence + status    |
| GET    | `/cycles/:cid/modules/:mid`                   | narrative, parity matrix, source quotes, filled keys |
| POST   | `/cycles/:cid/modules/:mid/edit-prompt`       | tenant prompt override (creates new prompt version) |

### 3.8 Reports (`/cycles/:cid/reports`)

| Method | Path                                                  | Purpose                              |
| ------ | ----------------------------------------------------- | ------------------------------------ |
| GET    | `/report-types`                                       | catalog (with credit cost, tier)     |
| GET    | `/cycles/:cid/reports`                                | list rendered reports                |
| POST   | `/cycles/:cid/reports/render`                         | body: `{report_type_id, template_id?}`; returns 202 + render id |
| GET    | `/cycles/:cid/reports/:rid`                           | render status + download URLs        |
| GET    | `/cycles/:cid/reports/:rid/download.pdf`              | streams PDF (signed)                 |
| GET    | `/cycles/:cid/reports/:rid/download.html`             | streams HTML                         |
| POST   | `/cycles/:cid/reports/:rid/share`                     | create share link (optional pwd)     |
| DELETE | `/cycles/:cid/reports/:rid/share/:sid`                | revoke share link                    |
| GET    | `/public/r/:token`                                    | public render viewer (no auth)       |

### 3.9 Credits & billing (`/credits`, `/billing`)

| Method | Path                                | Purpose                                        |
| ------ | ----------------------------------- | ---------------------------------------------- |
| GET    | `/credits/balance`                  | balance, allowance, period reset                |
| GET    | `/credits/ledger`                   | paginated                                       |
| POST   | `/credits/topup/checkout`           | body: `{pack_code}` → Dodo Checkout URL          |
| GET    | `/billing/plans`                    | catalog                                         |
| POST   | `/billing/subscribe/checkout`       | body: `{plan_code}` → Dodo Checkout URL          |
| GET    | `/billing/portal`                   | Dodo billing portal URL                          |
| GET    | `/billing/invoices`                 | list invoices                                    |
| POST   | `/webhooks/dodo`                    | Dodo webhook receiver (signature verified)       |

### 3.10 AI endpoints (`/ai-endpoints`)

| Method | Path                                | Purpose                                 |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/ai-endpoints`                     | list (api keys never returned)           |
| POST   | `/ai-endpoints`                     | create (encrypts key)                    |
| PATCH  | `/ai-endpoints/:id`                 | update (rotate key on `api_key` field)   |
| DELETE | `/ai-endpoints/:id`                 | soft delete                              |
| POST   | `/ai-endpoints/:id/test`            | proxy a small completion, return latency, model echo |
| GET    | `/ai-endpoints/routing`             | current `tenant_ai_routing` map          |
| PUT    | `/ai-endpoints/routing`             | bulk set routing                          |

### 3.11 Templates (`/templates`)

| Method | Path                                | Purpose                                 |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/templates`                        | list (system + tenant)                   |
| POST   | `/templates`                        | upload tenant template (validates Handlebars in sandbox) |
| GET    | `/templates/:id`                    | fetch                                    |
| PATCH  | `/templates/:id`                    | update body (creates new version)        |
| DELETE | `/templates/:id`                    | soft delete                              |
| POST   | `/templates/:id/preview`            | render with sample content keys          |
| POST   | `/templates/:id/set-default`        | mark default for a report type           |

### 3.12 Webhooks (`/webhooks`)

| Method | Path                                | Purpose                       |
| ------ | ----------------------------------- | ----------------------------- |
| GET    | `/webhooks`                         | list                           |
| POST   | `/webhooks`                         | create (returns signing secret once) |
| PATCH  | `/webhooks/:id`                     | rotate secret, change events   |
| DELETE | `/webhooks/:id`                     |                                |
| GET    | `/webhooks/:id/deliveries`          | log                            |
| POST   | `/webhooks/:id/deliveries/:did/retry` | manual retry              |

### 3.13 Admin (platform-level, `/admin`)

Restricted to `platform_admin` role on `users` (separate from tenant roles).

| Method | Path                                          | Purpose                          |
| ------ | --------------------------------------------- | -------------------------------- |
| GET    | `/admin/prompts`                              | list system prompts               |
| POST   | `/admin/prompts`                              | create new system prompt version  |
| GET    | `/admin/prompts/:id/runs`                     | recent runs (telemetry)           |
| GET    | `/admin/clusters`, `/admin/modules`, `/admin/questions` | catalog CRUD          |
| GET    | `/admin/report-types`                         | catalog                          |
| POST   | `/admin/report-types`                         | create                           |
| GET    | `/admin/components`                           | reusable components catalog (SWOT, PESTLE, parity matrix templates) |
| POST   | `/admin/components`                           | create component                 |
| GET    | `/admin/tenants`                              | platform tenant list              |
| POST   | `/admin/tenants/:id/credits/adjust`           | manual ledger entry               |

### 3.14 Audit & compliance (`/audit`, `/data`)

| Method | Path                                | Purpose                                        |
| ------ | ----------------------------------- | ---------------------------------------------- |
| GET    | `/audit`                            | tenant audit log (filterable)                   |
| POST   | `/data/export`                      | request data export job                          |
| GET    | `/data/export/:id`                  | status + download URL                            |
| POST   | `/data/delete`                      | request deletion (scope=tenant\|user\|cycle)     |
| GET    | `/data/delete/:id`                  | status                                           |

### 3.15 n8n callbacks (`/n8n`, internal-only)

Bound to `127.0.0.1` only. HMAC-signed with `N8N_CALLBACK_SECRET`.

| Method | Path                                            | Purpose                          |
| ------ | ----------------------------------------------- | -------------------------------- |
| POST   | `/n8n/callbacks/followup-generated`             | n8n returns generated follow-up   |
| POST   | `/n8n/callbacks/synthesis-stage-complete`       | per-module result                 |
| POST   | `/n8n/callbacks/cycle-reduced`                  | cross-module reducer output       |
| POST   | `/n8n/callbacks/job-failed`                     | failure with error details        |

---

## §4 Auth system

### 4.1 Cryptography

- Passwords: argon2id (`memory=64MB, iterations=3, parallelism=2`).
- TOTP secrets, AI endpoint keys, webhook secrets: AES-256-GCM with a per-tenant DEK; DEKs wrapped by the platform KEK (env `IL_KMS_KEK_HEX`, 32 bytes hex). For SOC 2, plan migration to a managed KMS (AWS KMS / GCP KMS) — abstract behind `lib/kms/index.ts` with `wrap()`, `unwrap()`, `rotate()`.
- Session token: 32 random bytes, base64url; stored only as `sha256` in `user_sessions.token_hash`.
- Magic link / OTP / invite tokens: 32 bytes random; stored as sha256 hash; constant-time compare on verify.

### 4.2 Magic link flow

1. `POST /auth/magic-link/request {email, purpose}`:
   - Always 200 (no enumeration).
   - If user exists or `purpose=signup`, create `user_magic_links` row, expires 15 min.
   - Send email: `https://app.ilinga.com/auth/callback/magic?token=<raw>`.
2. Web client posts `token` to `/auth/magic-link/verify` → server hashes, looks up, checks `consumed_at IS NULL` and `expires_at > now()`, marks consumed in same transaction, creates session, sets cookie.
3. If `purpose=tenant_invite`, the verify step also accepts the invitation atomically (creates `tenant_members`).

### 4.3 OTP flow

1. `POST /auth/otp/request` generates 6-digit code, bcrypts, stores in `user_email_otps`, expires 10 min, max 5 attempts.
2. `POST /auth/otp/verify` checks attempts, bcrypt-verifies, marks consumed, creates session.
3. Used for step-up (e.g. before role change) and as alt sign-in.

### 4.4 Password + TOTP

- `password/login` returns `{mfa_required: true, mfa_token}` when TOTP enabled. Client posts `mfa_token + code` to `/auth/totp/verify` to finish.
- Recovery codes: 10 codes, sha256 hashed, single-use, regenerable.
- Step-up auth required for: disabling MFA, viewing recovery codes, changing email, deleting tenant, exporting data.

### 4.5 Google OAuth 2.0

- Authorization Code + PKCE.
- `state` cookie (signed) prevents CSRF; `nonce` in id_token validated.
- Email must be verified in id_token; otherwise prompt for OTP.
- On callback, upsert `users` by email, link via `user_oauth_identities`. If existing user has password+TOTP, require step-up before linking.

### 4.6 Sessions & cookies

- Cookie name `il_session`, value = raw token, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Domain=.ilinga.com`.
- Idle timeout 24h, absolute timeout 30 days. Sliding refresh on each request (`expires_at = now + 24h`, capped at absolute 30d).
- Trusted device: `il_device` cookie (signed JWT, 30d) lets user skip MFA on subsequent sign-ins from same device fingerprint.
- CSRF: separate `il_csrf` cookie (`SameSite=Strict`, not HttpOnly) + `X-Il-Csrf` header on writes. Double-submit verified server-side.

### 4.7 Rate limiting & abuse protection

- Token bucket per (IP, route) using Redis-equivalent (use CockroachDB-backed table `rate_limit_buckets` or run a small Valkey instance via PM2). Limits in §3.1.
- `failed_login_counters` table tracks per-user failures; after 10 fails in 15 min, lock for 15 min and email user.
- Bot defence: hCaptcha invisible challenge on signup, magic-link request, OTP request when `risk_score > threshold` (basic IP reputation list).

### 4.8 Audit

Every auth event writes `audit_log` with `action ∈ {auth.signin, auth.signout, auth.mfa.enabled, auth.mfa.disabled, auth.password.changed, auth.session.revoked, auth.oauth.linked}` plus IP/UA.

---

## §5 Multi-tenancy

### 5.1 Isolation model

Row-level with `tenant_id` on every tenant-scoped table. No row-level security at the DB layer (Cockroach RLS is not first-class) — enforced in app via Drizzle query middleware:

`packages/db/src/tenant-scope.ts`
- Exposes `withTenant(db, tenantId)` returning a Drizzle proxy where every `select`, `update`, `delete` automatically appends `WHERE tenant_id = $tenantId`.
- Inserts auto-fill `tenant_id`.
- Tables in an allow-list (`users`, `audit_log`, `subscription_plans`, etc.) are accessible without scope; everything else throws `MissingTenantScopeError` if accessed via the unscoped client outside an explicit `db.unsafeUnscoped(...)` block (used only by platform admin and migrations).

Request lifecycle (Fastify plugin `plugins/tenant.ts`):
1. Read `X-Il-Tenant` header.
2. Verify `tenant_members` membership for `request.user.id`.
3. Attach `request.tenant = { id, role, plan }` and `request.db = withTenant(rootDb, tenantId)`.
4. Reject with 403 if not a member or seat suspended.

### 5.2 Plan-gated seat limits

- `tenant_invitations` POST checks `count(active members) + count(pending invites) < seat_limit`.
- Plan downgrade hook: if seats > new limit, oldest non-owner members get `seat_status='suspended'` until owner reassigns.

### 5.3 Tenant-scoped encryption keys

- On tenant create, generate a 32-byte DEK, wrap with platform KEK (AES-GCM), store wrapped form in `tenants.dek_wrapped`. Cache unwrapped DEK in memory per request (LRU, max 5 min, max 100 tenants).
- Rotation: `POST /admin/tenants/:id/dek/rotate` re-encrypts `tenant_ai_endpoints.api_key_*`, `webhooks.secret_*`, `user_mfa.totp_*` (for users whose default tenant is this one — though MFA is user-level, so use platform key for `user_mfa`).

### 5.4 Customer-facing portals (wildcard)

- Tenants on Pro+ plans can opt in: `tenants.customer_portal_enabled = true` and set `customer_portal_domain`.
- Caddy `on_demand_tls` issues certs at first request. The web app reads `Host` header, finds the tenant, and renders a "customer mode" UI scoped to ventures the customer is associated with.
- Customer accounts live in `users` but with a flag `is_customer_facing = true` and a `tenant_id` parent — they cannot access internal admin views.

---

## §6 Content key system (the core domain)

Content keys are the lingua franca between interview answers, prompts, module
outputs, and reports. Everything resolves to entries in the `content_keys`
table, scoped to a `cycle_id`.

### 6.1 Lifecycle

```
question_answers ──┐                                       ┌── report_renders
artifacts (extracted)├──► content_keys (per cycle, versioned)─►module/report templates
prompt_runs (derived)┘                                       └── webhooks/exports
```

### 6.2 Extraction

`apps/api/src/modules/interviews/extractor.ts` runs after each answer submit:

1. Look up `question_content_key_mappings` for the question.
2. For each mapping, run the configured `extractor`:
   - `direct`: copy `answer_text` (or path within `answer_payload`) into `value_text` / `value_json`.
   - `regex`: apply pattern, capture group → value.
   - `json_path`: against `answer_payload`.
   - `llm_extract`: call routed AI endpoint with extraction prompt template; cost charged to cycle.
3. Conflict resolution:
   - If key already exists for cycle, mark previous as `superseded_at = now()` and insert new row with `version = prev.version + 1`.
   - Higher-priority extractors override lower-priority ones; same priority + later answer wins.
4. Emit `content_key.updated` internal event → triggers downstream re-synthesis only if a downstream prompt declared this key in `required_keys`.

### 6.3 Substitution

`apps/api/src/lib/keys/substitute.ts`:

- Given a template string with `{{key.path}}` placeholders, fetch current (non-superseded) `content_keys` for cycle, build a deep object (e.g. `{venture: {name: ...}, competitor: {lead: ...}}`), and substitute via Handlebars helpers `{{key 'venture.name'}}` to support fallbacks (`{{key 'x' default='—'}}`).
- Missing required keys: prompt run is paused with `status='blocked_missing_keys'`; the synthesis UI surfaces these.
- Type safety: `value_type` enforced at substitution time. JSON keys flatten via Handlebars partials.

### 6.4 Versioning

- `content_keys.version` increments per `(cycle_id, code)`.
- "Current" view: `content_keys` where `superseded_at IS NULL`.
- Re-synthesis records `prompt_runs.input_keys_snapshot` with the resolved values at that moment, so reports rendered later are reproducible (`report_renders.content_keys_snapshot`).
- Cycle close freezes the store: all keys gain `superseded_at = cycle.closed_at`, and a new cycle starts version=1.

### 6.5 Stakeholder feedback as a content source

When a stakeholder responds to a question via a magic-link token:
- `stakeholder_responses` row written.
- Same extractor runs but tagged `source='stakeholder'` on resulting `content_keys`.
- `confidence` defaults to 0.5 (lower than direct interview); admin can re-weight.

### 6.6 Reusable components (admin)

`admin_components` (extension to §2.7) define reusable Handlebars partials such
as `swot`, `pestle`, `parity_matrix`. They are registered with the Handlebars
sandbox at render time so report templates can `{{> swot scope='venture'}}`.
Components themselves consume content keys through a manifest (`required_keys`)
which the renderer validates before invocation.

---

## §7 n8n integration

### 7.1 Topology

- n8n runs on `127.0.0.1:5678` under PM2 (fork mode, single instance).
- Caddy does **not** proxy n8n — it is internal-only.
- API and n8n share a Postgres-compatible connection to a dedicated `n8n` database (Cockroach is mostly PG-compatible; if compatibility issues arise, use a separate Postgres container for n8n only).
- Communication is bidirectional but never via the public internet:
  - **API → n8n**: HTTPS to `http://127.0.0.1:5678/webhook/...` with `X-N8N-Signature` HMAC header (`N8N_INBOUND_SECRET`).
  - **n8n → API**: HTTPS to `http://127.0.0.1:3001/v1/n8n/callbacks/...` with `X-Il-N8N-Signature` HMAC (`N8N_CALLBACK_SECRET`).

### 7.2 Workflows

Stored as JSON in `infra/n8n/workflows/` and imported via n8n CLI on deploy.

| Workflow                          | Trigger                                              | Output                                            |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `wf-interview-followup`           | API webhook `answer-submitted`                       | follow-up question(s) → callback                  |
| `wf-module-synthesis`             | API webhook `module-synth`                           | narrative + parity + filled keys → callback        |
| `wf-cross-module-reducer`         | API webhook `cycle-reduce`                            | conflict resolutions, winning narratives           |
| `wf-report-prerender`             | API webhook `report-prerender`                        | enriched key store for renderer                    |
| `wf-competitor-scrape`            | API webhook `competitor-scrape`                       | summary + parity scores                            |
| `wf-artifact-extract`             | API webhook `artifact-extract`                        | text excerpt + key extractions                     |

Every workflow's first node is a "Validate Signature" Function node; the last node calls back to the API.

### 7.3 Tenant AI routing in n8n

- API attaches the tenant's routing config and the **plaintext API key for the chosen workload** to the webhook payload, encrypted with a per-job ephemeral key derived from `N8N_INBOUND_SECRET + job_id`. n8n decrypts only inside the workflow run.
- Rationale: avoid persisting tenant secrets in n8n's credential store. Each job carries its own credentials.
- Fallback: if the routed endpoint errors, n8n uses a system endpoint with `routing_fallback=true` flag in the callback so the API can debit credits accordingly.

### 7.4 Job lifecycle (`n8n_jobs`)

1. API inserts row `status='queued'`, posts to n8n webhook.
2. n8n acknowledges with `executionId`; API stores in `n8n_execution_id`, `status='running'`.
3. On callback, API updates `status='done'` or `'failed'`, writes downstream rows (`question_followups`, `prompt_runs`, etc.) in the same transaction.
4. Watchdog cron (`workers/n8n-watchdog.ts`) every 60s: jobs `running > 10 min` are checked via n8n API (`GET /executions/:id`); if stale, marked failed and retried with exponential backoff (max 3 attempts).

### 7.5 Events

The API emits these internal events (Node EventEmitter + persistent outbox `webhook_deliveries` for tenant subscribers):

- `cycle.brief_submitted`
- `cycle.competitor_added`
- `cycle.artifact_uploaded`
- `cycle.answer_submitted`
- `cycle.followup_generated`
- `cycle.cluster_complete`
- `cycle.module_synthesized`
- `cycle.reduced`
- `cycle.closed`
- `report.rendered`
- `report.shared`
- `credits.balance_low` (≤10% allowance)
- `credits.toppedup`
- `subscription.changed`

n8n only consumes a subset (the synthesis-relevant ones); tenants subscribe to any via §3.12.

---

## §8 Dodo Payments integration

### 8.1 Plans (catalog)

Seed in `packages/db/seed/plans.ts`:

| code     | display | monthly USD | monthly credits | seats |
| -------- | ------- | ----------- | --------------- | ----- |
| `free`   | Free    | 0           | 30              | 1     |
| `studio` | Studio  | 49          | 500             | 3     |
| `pro`    | Pro     | 149         | 2000            | 8     |
| `firm`   | Firm    | 399         | 10000           | 25    |

Top-up packs:

| code      | credits | USD  |
| --------- | ------- | ---- |
| `pack100` | 100     | 19   |
| `pack500` | 500     | 79   |
| `pack2k`  | 2000    | 269  |
| `pack10k` | 10000   | 1099 |

### 8.2 Checkout flow

- `POST /billing/subscribe/checkout` creates a Dodo Checkout session (line items by `dodo_product_id`), passes `metadata = {tenant_id, plan_code}`, and returns the Dodo URL.
- `POST /credits/topup/checkout` similarly with `metadata = {tenant_id, pack_code}`.
- Success URL: `https://app.ilinga.com/credits?checkout=success&session_id=...`.
- Cancel URL: `https://app.ilinga.com/credits?checkout=cancel`.

### 8.3 Webhook (`POST /webhooks/dodo`)

- Verify `Dodo-Signature` HMAC against `DODO_WEBHOOK_SECRET`.
- Idempotency via `event.id` → `credit_ledger.dodo_event_id` unique constraint.
- Events handled:
  - `payment.succeeded` (one-time): credit pack → insert `credit_ledger` `delta = pack.credits, reason='topup'`, update `credit_balances`.
  - `subscription.created` / `subscription.updated`: upsert `tenant_subscriptions`, update `tenant_plans` row (close previous, insert new).
  - `subscription.cancelled`: schedule downgrade to `free` at `current_period_end`.
  - `subscription.renewed`: insert monthly allowance into `credit_ledger` (`reason='monthly_allowance'`, only if last allowance entry < current period start).
  - `invoice.paid` / `invoice.failed`: write to `audit_log`, alert via `credits.balance_low` if past_due.
- Re-deliver via Dodo's retry by returning non-2xx on transient failures.

### 8.4 Credit charging

Service `apps/api/src/modules/credits/charger.ts`:
- `charge(tenantId, amount, reason, refTable, refId)`:
  - Transactional: read latest `balance_after` from `credit_ledger`, fail if `balance < amount` (return `INSUFFICIENT_CREDITS`).
  - Insert ledger row `delta = -amount, balance_after = prev - amount`.
  - Update `credit_balances`.
- Re-render rule: `report_renders.is_rerender = true` if a prior render exists for `(cycle_id, report_type_id, template_id, template_version)` — charges 0 credits but still records ledger entry with `delta=0, reason='render_free'` for traceability.

### 8.5 Invoices & portal

- `GET /billing/invoices` proxies Dodo `GET /customers/:id/invoices` (cached 60s).
- `GET /billing/portal` returns a Dodo billing portal session URL.

---

## §9 AI endpoint management (BYO model)

### 9.1 Storage

`tenant_ai_endpoints` rows store ciphertext. Plaintext API key is **never** logged, never returned in API responses. The `PATCH /ai-endpoints/:id` accepts `{api_key}` only when explicitly rotating.

Encryption flow:
- `lib/kms/encryptForTenant(tenantId, plaintext) → {ciphertext, iv, tag, kms_key_id}` uses tenant DEK.
- `lib/kms/decryptForTenant(...)` returns plaintext only inside trusted code paths (test connection, dispatch to n8n, server-side completion proxy).

### 9.2 Test connection

`POST /ai-endpoints/:id/test`:
- Server proxies a small completion (e.g. `"Reply with the word 'pong' only."`) using provider-specific SDK (`openai`, `@anthropic-ai/sdk`, `@aws-sdk/client-bedrock-runtime`, `@google-cloud/aiplatform`, raw HTTP for OpenAI-compatible).
- Validates: HTTP 200, output non-empty, latency < 30s, model echo matches configured `model_id` if provider returns it.
- Updates `status` (`connected|error`), `last_test_at`, `last_error`.
- Rate-limited 5/min per tenant.

### 9.3 Routing

`tenant_ai_routing` maps each workload to an endpoint. UI in Settings → AI Endpoints (matches prototype). Default routing on first endpoint creation: all workloads point to it.

Workload selection inside the API:
- `getRoutedEndpoint(tenantId, workload)` returns `{endpoint, fallback}`.
- For n8n jobs, both are passed; n8n executes with fallback on error.
- For server-side calls (artifact extraction, LLM key extractor), the API does fallback locally.

### 9.4 System endpoint fallback

- Platform maintains a system endpoint (env `IL_SYSTEM_OPENAI_KEY`) used:
  - When a tenant has no endpoints (free tier).
  - When a tenant explicitly sets fallback to system.
  - When a tenant endpoint fails and the routing config allows fallback.
- System endpoint usage charges credits at platform-defined multipliers (see `prompts.credit_cost`).
- BYO endpoint usage charges only the orchestration credit (a fixed lower amount) — tokens billed by the tenant's provider directly.

### 9.5 Provider abstraction

`apps/api/src/lib/ai/providers/` — one file per provider implementing:

```ts
interface AiProvider {
  test(endpoint: TenantAiEndpoint, plaintextKey: string): Promise<TestResult>;
  complete(req: CompleteRequest): Promise<CompleteResult>;
  embed(req: EmbedRequest): Promise<EmbedResult>;
}
```

Concrete: `openai.ts`, `azure-openai.ts`, `anthropic.ts`, `bedrock.ts`, `vertex.ts`, `ollama.ts`, `openai-compat.ts`.

---

## §10 Report generation pipeline

### 10.1 Templates

- System templates ship in `packages/db/seed/system-report-templates/*.hbs`. Loaded into `report_templates` with `tenant_id IS NULL, is_default=true`.
- Tenants upload custom templates via `POST /templates` — body validated with the Handlebars sandbox parser before storage.
- Versioned: any update creates a new `report_templates` row with `version+1`; previous render artifacts remain pinned to their version.

### 10.2 Sandbox

`apps/api/src/lib/handlebars-sandbox.ts`:
- Custom Handlebars instance with **no** access to `Object.prototype`/prototypes (use `noEscape:false`, custom `helpers` allow-list).
- Disable `{{#with}}` block helper (prevents prototype walks); use `{{key 'path'}}` instead.
- Allowed helpers: `eq`, `ne`, `gt`, `lt`, `formatDate`, `formatNumber`, `pct`, `truncate`, `markdown`, `key`, `keyJson`, `score`, `pluralize`, registered partials from `admin_components`.
- Template parser pre-walks the AST; rejects on disallowed helpers, raw `{{{...}}}` triple-stash, `eval`-like expressions, or `__proto__`/`constructor` references.
- Render is wrapped in `vm2`-style isolated context with 5s timeout and 50MB memory cap.

### 10.3 Render pipeline

`POST /cycles/:cid/reports/render` flow:
1. Validate report type, template, charge credits (or mark rerender free).
2. Insert `report_renders` row, `status='queued'`.
3. Enqueue BullMQ job `render-report`.
4. Worker (`apps/api/src/workers/render-report.ts`):
   - Snapshot current content keys → `content_keys_snapshot`.
   - Resolve template, run substitution.
   - Use Playwright (`@playwright/test` headless Chromium, single shared browser pool) to render HTML → PDF.
   - Upload HTML and PDF to S3-compatible object storage (env `IL_S3_BUCKET`); store keys.
   - Compute sha256.
   - `status='done'`, emit `report.rendered`.
5. On failure, refund credits (insert `credit_ledger` `delta=+amount, reason='refund'`).

### 10.4 Downloads

- `GET /cycles/:cid/reports/:rid/download.pdf` issues a 5-minute signed URL (S3 presigned GET) and 302s the client to it. Audit logged.
- Public share links (`/public/r/:token`): server resolves token → `report_renders`, optionally checks password, increments `download_count`, redirects to signed URL.

### 10.5 Re-render economics

- Re-rendering the same `(cycle, report_type, template_version)` within the cycle = free.
- Resynthesizing a feeder module then re-rendering = free (the change is in feeder, not the report itself); the rule keys on whether `content_keys_snapshot` differs by hash.
- Forcing `?force=true` in the render request charges full price (used after re-synthesis to refresh).

---

## §11 Admin features (platform-level)

Restricted to users with `users.platform_role = 'admin'` (separate from tenant `tenant_members.role`). Admin UI lives at `app.ilinga.com/admin/*` — guarded route, hidden from tenant nav.

### 11.1 Prompt designer

UI (web): `routes/_app/admin/prompts/`.

- List by `(module|report_section|interview_followup|reducer)` with filter by version.
- Create/edit form:
  - Code, purpose, module/report assignment.
  - Template editor (Monaco) with token highlighting for `{{key}}` and live preview pane that resolves keys against a sample cycle.
  - Inputs declared (`required_keys`), outputs declared (`output_keys`).
  - Model constraints: temperature, max tokens, JSON mode.
  - Credit cost.
- Save creates new `prompts` row with `version+1`, sets prior `is_active=false` only when "Promote" clicked.
- "Test run" panel: pick a real cycle, runs prompt with current draft, shows token usage, output, diff vs current production.

### 11.2 Cluster / module / question configuration

- CRUD over `clusters`, `modules`, `questions`, `question_content_key_mappings`.
- Drag-and-drop ordering (writes `order_index`).
- Per-question hint chips, min-chars, content key extraction config.

### 11.3 Report type configuration

- CRUD over `report_types`. Define feeder modules, tier, credit cost.
- Assign default template; preview against sample cycle.

### 11.4 Component builder

`admin_components` table (extension):
- `id`, `code`, `display_name`, `kind` (`partial|widget`), `template`, `required_keys`, `version`, `is_active`.
- UI to author Handlebars partials usable in report templates: `swot`, `pestle`, `parity_matrix`, `bcg_quadrant`, `okr_table`.
- Each component declares its required keys; renderer validates before injection.

### 11.5 Stakeholder feedback loops

- UI (tenant-side, but admin-configurable defaults): cycle owner picks questions and/or rendered reports, invites stakeholders by email.
- Admin can configure templates for stakeholder emails per `relation` type.
- Responses ingested as `stakeholder_responses` and folded into `content_keys` (§6.5).

### 11.6 Telemetry

- `/admin/prompts/:id/runs` shows token usage, latency p50/p95, error rate, credits charged.
- `/admin/tenants` shows MRR, plan distribution, churn risk (no usage in 30d).

---

## §12 Compliance + audit

### 12.1 Audit log

- Fastify plugin `plugins/audit.ts` wraps every mutating route.
- Captures `actor`, `action` (derived from route), `target_table`, `target_id`, `before` (pre-image), `after` (post-image), `ip`, `user_agent`, `request_id` (`X-Request-Id` UUID).
- Append-only; deletions never remove rows. Retention: 7 years (POPIA + SOC 2).
- Sensitive fields (`password_hash`, `api_key_*`, `totp_secret_*`) redacted to `***` in `before`/`after`.
- Index `(tenant_id, created_at DESC)` enables paginated queries from `/audit`.

### 12.2 GDPR / POPIA

**Data export**:
- `POST /data/export` enqueues `data_export_jobs`.
- Worker collects all tenant-scoped rows from every table, plus user records for users in this tenant, into a JSON tarball + manifest, uploads to S3, returns 24h signed URL.
- Email user when ready.

**Data deletion**:
- `POST /data/delete {scope, target_id, dry_run}`:
  - `scope=user`: scrub user PII in `users` (email → `deleted-<id>@redacted.invalid`, name → "Deleted user"), nullify FKs in `audit_log` to `actor_user_id` (preserve action), delete sessions/MFA/oauth.
  - `scope=cycle`: hard-delete artifacts (S3 + DB), keep `audit_log` (anonymised), keep summary `cycle_deleted_at`.
  - `scope=tenant`: cascade delete all tenant-scoped rows; `audit_log` retained with `tenant_id` blanked but action history preserved for SOC 2 evidence.
- `dry_run=true` returns counts only.
- Job runs in single Cockroach transaction per logical group with checkpointing.

**Residency**:
- `tenants.region` ∈ `eu|us|za`. S3 buckets and Cockroach clusters per region (env `IL_REGION`).
- Tenant create routes to a region; cross-region access blocked at API gateway via Caddy header check.

### 12.3 Retention

- `venture_artifacts.purged_at` set when retention elapses (`auto_delete_artifacts_at`).
- Default 90 days post cycle close; configurable per-tenant `tenants.artifact_retention_days`.
- Cron `workers/retention.ts` daily: deletes S3 objects, sets `purged_at`, records audit.
- `audit_log` retained 7 years regardless.

### 12.4 Encrypted secrets at rest

- All `*_ciphertext` fields (see §2). KEK rotated annually; rotation re-wraps DEKs without re-encrypting tenant data.
- DB-level encryption: rely on managed CockroachDB at-rest encryption.

### 12.5 SOC 2 Type II evidence hooks

`docs/SOC2_CONTROLS.md` lists controls; the platform produces evidence automatically:

- **CC6.1 Logical access**: monthly export of `audit_log` filtered to `auth.*` and `*.role.changed`.
- **CC6.6 MFA**: report on `user_mfa.totp_enabled_at IS NOT NULL` percentage among admins.
- **CC7.2 Monitoring**: PM2 logs shipped to centralised log store; failed logins, 5xx rate dashboards.
- **CC8.1 Change management**: GitHub PR + CI logs retained; release tags.
- **A1.2 Backups**: nightly Cockroach backup to S3, weekly restore drill (script in `infra/restore-drill.sh`).
- **C1.1 Confidentiality**: KMS rotation logs, access reviews quarterly.
- Evidence collector cron writes to `infra/evidence/<YYYY-MM>/` and uploads to compliance vault.

### 12.6 Vendor / sub-processor list

`docs/SUBPROCESSORS.md` lists Dodo Payments, CockroachDB Cloud, S3 provider, email provider, with DPAs on file.

---

## §13 Legal pages (frontend)

Routes in `apps/web/src/routes/_public/legal/`:

- `/legal/terms` → `terms.tsx` (Terms of Service)
- `/legal/privacy` → `privacy.tsx` (Privacy Policy with GDPR + POPIA disclosures)
- `/legal/eula` → `eula.tsx` (End-User Licence Agreement)
- `/legal/cookies` → `cookies.tsx` (Cookie Policy)
- `/legal/dpa` → `dpa.tsx` (Data Processing Addendum, downloadable PDF)
- `/legal/subprocessors` → `subprocessors.tsx` (rendered from `docs/SUBPROCESSORS.md`)

Implementation:
- Content in MDX (`content/legal/*.mdx`), version-tagged. The footer of each page shows `Last updated: {date}`.
- Sign-up flow requires `accept_terms` and `accept_privacy` checkboxes; acceptance recorded in `audit_log` with the document version hash.
- Cookie banner component (`components/cookie-banner.tsx`) — strictly necessary cookies only by default; analytics opt-in.
- Footer links present on every public page and inside the app shell.

---

## §14 Deployment architecture

```
GeoDNS (latency-routed A records → nearest VM)
  └─ Ubuntu 24.04 VM (per region: eu-west, us-east, af-south)
       ├─ Caddy 2 (auto-TLS, on-demand for wildcard customer portals)
       │    ├─ ilinga.com           → web/dist (static, marketing)
       │    ├─ app.ilinga.com       → web/dist (SPA, fallback to /index.html)
       │    ├─ api.ilinga.com       → 127.0.0.1:3001
       │    └─ *.portal.ilinga.com  → web/dist (SPA, customer-portal mode)
       │       (also accepts CNAMEs from tenant domains via on_demand_tls)
       ├─ PM2
       │    ├─ ilinga-api  (cluster, 2 instances, 127.0.0.1:3001)
       │    ├─ ilinga-workers (fork, 1 instance — render, webhook, retention)
       │    └─ n8n         (fork, 1 instance, 127.0.0.1:5678 — internal only)
       ├─ Local Redis-compatible (Valkey, 127.0.0.1:6379) — BullMQ queues
       └─ NO inbound exposure for n8n or Valkey
```

CockroachDB and S3 are external managed services; URLs in env.

### 14.1 Caddyfile (`infra/caddy/Caddyfile`)

```caddy
{
    email ops@ilinga.com
    on_demand_tls {
        ask https://api.ilinga.com/v1/internal/tls-allowed
        interval 5m
        burst 10
    }
}

ilinga.com, www.ilinga.com {
    encode zstd gzip
    root * /var/www/ilinga-web
    try_files {path} /index.html
    file_server
    header /assets/* Cache-Control "public, max-age=31536000, immutable"
}

app.ilinga.com {
    encode zstd gzip
    root * /var/www/ilinga-web
    try_files {path} /index.html
    file_server
    header /assets/* Cache-Control "public, max-age=31536000, immutable"
    header X-Frame-Options "DENY"
    header X-Content-Type-Options "nosniff"
    header Referrer-Policy "strict-origin-when-cross-origin"
    header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.ilinga.com; frame-ancestors 'none'"
}

api.ilinga.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3001 {
        header_up X-Forwarded-Host {host}
        header_up X-Real-IP {remote}
    }
    header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
}

# Wildcard customer portals + custom domains via on_demand_tls
*.portal.ilinga.com {
    tls {
        on_demand
    }
    encode zstd gzip
    root * /var/www/ilinga-web
    try_files {path} /index.html
    file_server
}

# Tenant custom domains (CNAME → portal.ilinga.com), TLS issued on demand if approved
:443 {
    tls {
        on_demand
    }
    @approved expression `{http.request.host} != "ilinga.com"`
    handle @approved {
        root * /var/www/ilinga-web
        try_files {path} /index.html
        file_server
    }
}
```

The internal `tls-allowed` endpoint checks `tenants.customer_portal_domain` to whitelist hostnames before Caddy issues a cert.

### 14.2 PM2 (`infra/pm2/ecosystem.config.cjs`)

```js
module.exports = {
  apps: [
    {
      name: 'ilinga-api',
      script: 'apps/api/dist/index.js',
      exec_mode: 'cluster',
      instances: 2,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production', PORT: '3001' },
      env_file: '/etc/ilinga/api.env',
      out_file: '/var/log/ilinga/api.out.log',
      error_file: '/var/log/ilinga/api.err.log',
      time: true,
    },
    {
      name: 'ilinga-workers',
      script: 'apps/api/dist/workers/index.js',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' },
      env_file: '/etc/ilinga/api.env',
    },
    {
      name: 'n8n',
      script: 'node_modules/.bin/n8n',
      args: 'start',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '1G',
      env_file: '/etc/ilinga/n8n.env',
      out_file: '/var/log/ilinga/n8n.out.log',
    },
  ],
};
```

### 14.3 API env vars (`/etc/ilinga/api.env`)

```
NODE_ENV=production
PORT=3001
IL_REGION=eu

# Database
IL_DB_URL=postgresql://ilinga:...@<crdb-host>:26257/ilinga?sslmode=verify-full

# Object storage
IL_S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com
IL_S3_BUCKET=ilinga-eu
IL_S3_ACCESS_KEY=...
IL_S3_SECRET_KEY=...

# Cookies / origins
IL_COOKIE_DOMAIN=.ilinga.com
IL_WEB_ORIGIN=https://app.ilinga.com
IL_API_ORIGIN=https://api.ilinga.com

# KMS / encryption
IL_KMS_KEK_HEX=<64 hex chars>

# Auth
IL_SESSION_TTL_HOURS=24
IL_DEVICE_TRUST_DAYS=30
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT=https://api.ilinga.com/v1/auth/google/callback

# Email
IL_EMAIL_PROVIDER=postmark
IL_EMAIL_API_KEY=...
IL_EMAIL_FROM="Ilinga <noreply@ilinga.com>"

# Dodo Payments
DODO_API_KEY=...
DODO_WEBHOOK_SECRET=...
DODO_BASE_URL=https://api.dodopayments.com

# n8n
N8N_INBOUND_URL=http://127.0.0.1:5678
N8N_INBOUND_SECRET=<32 random bytes hex>
N8N_CALLBACK_SECRET=<32 random bytes hex>
N8N_API_KEY=<from n8n>

# System AI fallback
IL_SYSTEM_OPENAI_KEY=...
IL_SYSTEM_OPENAI_MODEL=gpt-4o

# Queue
IL_REDIS_URL=redis://127.0.0.1:6379

# Misc
IL_RATE_LIMIT_BACKEND=cockroach   # or 'redis'
IL_LOG_LEVEL=info
IL_REQUEST_ID_HEADER=X-Request-Id
HCAPTCHA_SECRET=...
```

### 14.4 n8n env vars (`/etc/ilinga/n8n.env`)

```
N8N_HOST=127.0.0.1
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_LISTEN_ADDRESS=127.0.0.1
N8N_DIAGNOSTICS_ENABLED=false
N8N_TELEMETRY_DISABLED=true
N8N_USER_FOLDER=/var/lib/n8n
N8N_ENCRYPTION_KEY=<32 random bytes>
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=ilinga
N8N_BASIC_AUTH_PASSWORD=<long random>
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=<n8n-db-host>
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=...
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336      # 14 days
WEBHOOK_URL=http://127.0.0.1:5678
N8N_PAYLOAD_SIZE_MAX=16
IL_API_CALLBACK_URL=http://127.0.0.1:3001/v1/n8n/callbacks
IL_CALLBACK_SECRET=<matches N8N_CALLBACK_SECRET>
```

### 14.5 GeoDNS

- Use a managed DNS provider (Cloudflare Geo Steering / Route 53 latency).
- A records:
  - `app.ilinga.com` → nearest VM
  - `api.ilinga.com` → nearest VM
  - `ilinga.com` → eu-west primary (CDN-fronted optional)
- Health checks per region; failover to secondary on 3-strike failure.

### 14.6 CI/CD

- GitHub Actions:
  - On PR: `pnpm install && pnpm turbo typecheck lint test build`.
  - On `main` merge: build artifacts (api dist, web dist) → SCP/Ansible to each VM → `pm2 reload ecosystem.config.cjs --update-env`.
  - n8n workflow imports run if `infra/n8n/workflows/*.json` changed.
- Migrations: `pnpm --filter @ilinga/db migrate` runs as a pre-deploy step against the regional DB.

---

## §15 Dark theme (CSS only — Phase 1 of frontend work)

This is the first frontend deliverable: switch the prototype's CSS root tokens
from light to dark while keeping all layout/components untouched. No JS theme
toggle yet — single dark theme as the canonical look.

### 15.1 Tokens (`apps/web/src/styles/tokens.css`)

```css
:root {
  /* Surface */
  --surface-base:        #0E0B08;   /* warm near-black */
  --surface-raised:      #15110D;
  --surface-overlay:     #1B1611;
  --surface-sunken:      #0A0806;

  /* Border */
  --border-subtle:       #2A231C;
  --border-strong:       #3A3026;
  --border-focus:        #D4622A;   /* terracotta */

  /* Text */
  --text-primary:        #F4ECE2;
  --text-secondary:      #BFB1A0;
  --text-tertiary:       #877867;
  --text-inverse:        #0E0B08;

  /* Signal (terracotta accent) */
  --signal-50:           #2A1810;
  --signal-200:          #6B3318;
  --signal-400:          #B3501F;
  --signal-500:          #D4622A;   /* primary */
  --signal-600:          #E47A3F;
  --signal-700:          #F09762;

  /* Status */
  --success:             #6FAE72;
  --warning:             #D4A03C;
  --danger:              #D45A4A;
  --info:                #6FA3C7;

  /* Data viz */
  --chart-1: #D4622A;
  --chart-2: #6FAE72;
  --chart-3: #D4A03C;
  --chart-4: #6FA3C7;
  --chart-5: #B47AC0;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
  --font-display: 'Söhne', 'Inter', sans-serif;

  /* Radii / shadows */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.6);

  color-scheme: dark;
}

html, body {
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

### 15.2 Token migration rules

When porting the prototype CSS:
- Replace any `#FFFFFF` / very-light surface → `var(--surface-base|raised|overlay)`.
- Replace `#0E0B08`-ish backgrounds (already dark in prototype) → keep, alias to token.
- Replace previous brand orange/terracotta → `var(--signal-500)`.
- Replace neutral text greys → `var(--text-primary|secondary|tertiary)` based on hierarchy.
- Replace borders → `var(--border-subtle|strong)`.
- Component tokens (e.g. `--button-bg`) live alongside in `tokens.css` and reference the primitives.

### 15.3 Acceptance criteria

- All five prototype screenshots render pixel-close in dark.
- Contrast ratios: body text ≥ 7:1 vs surface (AAA), secondary text ≥ 4.5:1 (AA).
- Charts and data viz remain legible against `--surface-raised`.
- Print stylesheet (`@media print`) overrides to light-on-white for PDF reports — reports must always render on white paper regardless of UI theme.

### 15.4 Out of scope for Phase 1

- Light theme toggle (deferred; the token system supports it via `[data-theme='light']` override block, but no UI yet).
- User-configurable accent (Pro feature, deferred).

---

## Appendix A — Open decisions

These warrant confirmation before Phase 2 starts:

1. **Object storage**: AWS S3 vs Cloudflare R2 vs Backblaze B2 — all S3-compatible, plan assumes S3 API.
2. **Email provider**: Postmark vs SES vs Resend — plan assumes Postmark for transactional reliability and templates.
3. **Search**: full-text over content keys / answers — defer to Phase 14, use Cockroach trigram for now.
4. **Realtime**: synthesis status updates currently use polling (`/synthesis/status`). If WebSockets required, add Fastify `@fastify/websocket` plugin and SSE fallback.
5. **Managed KMS migration timeline**: SOC 2 audit will likely require AWS KMS / GCP KMS rather than env-stored KEK. Plan migration in Phase 14.

## Appendix B — Glossary

- **Cycle**: one analysis pass on a venture (interview → synthesis → reports). Multiple cycles per venture (e.g. quarterly).
- **Cluster**: top-level grouping of modules (Positioning, Market & TAM, Competition, GTM, Product Strategy, Unit Economics, Risk & Compliance, Team & Capital).
- **Module**: a sub-domain within a cluster (e.g. Direct competition, Sizing). Each has questions and a synthesis prompt.
- **Content key**: a named slot (e.g. `competitor.lead`) that stores resolved data for a cycle. Used in prompts and report templates.
- **Prompt run**: an invocation of an admin-designed prompt, with input keys snapshot and output keys produced.
- **Render**: a report generation: template + content keys → HTML + PDF.
- **Wedge**: the venture's core differentiator (a content key: `venture.wedge`).



