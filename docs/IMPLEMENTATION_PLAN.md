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

## Gap audit (post v1)

After a design audit the original plan was missing or under-specified the
items below. They are now covered in §16–§32:

| Gap                                                     | Section                           |
| ------------------------------------------------------- | --------------------------------- |
| Transactional + marketing email (Resend / Postmark failover, deliverability) | §16              |
| SMS (OTP, alerts) with Twilio + MessageBird failover    | §17                               |
| Unified notifications (in-app, email, SMS, webhook)     | §18                               |
| Usage-based metering, taxes, dunning, trials, coupons   | §19 (extends §8)                  |
| Credit usage reporting per report/module/prompt/user    | §20                               |
| n8n agent designer (in-app workflow CRUD + versioning)  | §21                               |
| Export formats (PDF / HTML / DOCX / PPTX / MD), watermark, a11y | §22 (extends §10)         |
| AI model registry (system + tenant + fine-tunes + embeddings) | §23 (extends §9)            |
| Observability (logs, metrics, traces, errors, uptime)   | §24                               |
| Search + global command palette                         | §25                               |
| Backup & disaster recovery                              | §26                               |
| SSO (SAML/OIDC) + SCIM provisioning (Enterprise plan)   | §27                               |
| Tenant API tokens + OpenAPI + SDK generation            | §28                               |
| Public status page + incident comms                     | §29                               |
| Internationalisation + accessibility (WCAG 2.2 AA)      | §30                               |
| Anti-abuse hardening (CAPTCHA, fraud, ATO defence)      | §31                               |
| Light + dark theme as user-selectable options           | §15 (amended)                     |
| End-to-end completeness checklist                       | §32                               |

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
| 15    | Email + SMS + Notifications                       | §16, §17, §18 |
| 16    | Billing depth (metering, tax, dunning, trials, coupons) | §19 |
| 17    | Usage analytics + credit reporting                | §20         |
| 18    | n8n Agent Designer                                | §21         |
| 19    | Multi-format exports                              | §22         |
| 20    | AI model registry                                 | §23         |
| 21    | Observability + status page                       | §24, §29    |
| 22    | Search + command palette                          | §25         |
| 23    | Backup & DR drills                                | §26         |
| 24    | SSO + SCIM + API tokens                           | §27, §28    |
| 25    | i18n + a11y audit + anti-abuse                    | §30, §31    |

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

**Scope (simplified)**: only **email magic link** and **Google OAuth**. No
password, no TOTP, no email OTP, no SMS OTP, no SSO, no SCIM. Magic link
doubles as the password-reset / new-device re-auth flow.

### 4.1 Cryptography

- AI endpoint keys, webhook secrets: AES-256-GCM with a per-tenant DEK; DEKs wrapped by the platform KEK (env `IL_KMS_KEK_HEX`, 32 bytes hex). For SOC 2, plan migration to a managed KMS (AWS KMS / GCP KMS) — abstract behind `lib/kms/index.ts` with `wrap()`, `unwrap()`, `rotate()`.
- Session token: 32 random bytes, base64url; stored only as `sha256` in `user_sessions.token_hash`.
- Magic link / invite tokens: 32 bytes random; stored as sha256 hash; constant-time compare on verify.

### 4.2 Magic link flow

1. `POST /auth/magic-link/request {email, purpose}`:
   - Always 200 (no enumeration).
   - If user exists or `purpose=signup`, create `user_magic_links` row, expires 15 min.
   - Send email: `https://app.ilinga.com/auth/callback/magic?token=<raw>`.
2. Web client posts `token` to `/auth/magic-link/verify` → server hashes, looks up, checks `consumed_at IS NULL` and `expires_at > now()`, marks consumed in same transaction, creates session, sets cookie.
3. Purposes: `signup | signin | tenant_invite | email_change_verify | account_recovery`. `tenant_invite` accepts the invitation atomically (creates `tenant_members`). `email_change_verify` swaps `users.email` after the new address is confirmed.

### 4.3 Google OAuth 2.0

- Authorization Code + PKCE.
- `state` cookie (signed) prevents CSRF; `nonce` in id_token validated.
- Email must be verified in id_token; otherwise the user must complete a magic-link confirmation first.
- On callback, upsert `users` by email, link via `user_oauth_identities`.

### 4.4 Sessions & cookies

- Cookie name `il_session`, value = raw token, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Domain=.ilinga.com`.
- Idle timeout 24h, absolute timeout 30 days. Sliding refresh on each request (`expires_at = now + 24h`, capped at absolute 30d).
- Trusted device: `il_device` cookie (signed JWT, 30d) skips the new-device alert email.
- CSRF: separate `il_csrf` cookie (`SameSite=Strict`, not HttpOnly) + `X-Il-Csrf` header on writes. Double-submit verified server-side.
- Re-auth modal at 23h idle preserves form state via `useFormPersist`.

### 4.5 Rate limiting & abuse protection

- Token bucket per (IP, route) using Valkey. Magic link 5/min/IP and 5/hour/email. OAuth 30/min/IP.
- Bot defence: hCaptcha invisible challenge on `magic-link/request`; visible challenge if IP reputation flags risk.

### 4.6 New-device + impossible-travel

- New device fingerprint (no `il_device` cookie) → email alert via §16 with one-click "this wasn't me" → revokes all sessions.
- Impossible-travel detector (§31): sign-in from country B within 30 min of country A → alert + force a fresh magic link.

### 4.7 Audit

Every auth event writes `audit_log` with `action ∈ {auth.signin, auth.signout, auth.session.revoked, auth.oauth.linked, auth.email.changed, auth.account.deleted}` plus IP/UA.

### 4.8 Removed from earlier draft

- `password.*`, `totp.*`, `otp.*` (email + SMS) modules, `mfa_required` flow, recovery codes.
- Tables `user_mfa`, `user_email_otps`, `user_phone_otps` are not used. Drop in a future migration if persisted.
- All step-up flows: replaced by re-issuing a magic link for sensitive actions (delete tenant, export data, change email, rotate AI endpoint key) via `purpose=step_up`.

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

| code         | display    | monthly USD | monthly credits | seats   |
| ------------ | ---------- | ----------- | --------------- | ------- |
| `free`       | Free       | 0           | 30              | 1       |
| `studio`     | Studio     | 49          | 500             | 3       |
| `pro`        | Pro        | 149         | 2000            | 8       |
| `firm`       | Firm       | 399         | 10000           | 25      |
| `enterprise` | Enterprise | custom      | custom          | custom  |

Enterprise is bespoke pricing arranged manually; record stored with
`dodo_subscription_id=NULL` until a Dodo subscription is provisioned. SSO/SCIM
is **not** an Enterprise feature at GA (§27 reserved). Enterprise unlocks:
elevated rate limits, dedicated support, custom DPAs, optional dedicated VM.

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

**EU-only at GA.** US + ZA records remain dormant until those regions are
provisioned (no plan changes needed at that point — just add nodes + DNS
records).

```
DNS (single-region at GA; GeoDNS-ready for later expansion)
  └─ Ubuntu 24.04 VM (eu-west)
       ├─ Caddy 2 (auto-TLS, on-demand for wildcard customer portals)
       │    ├─ ilinga.com           → web/dist (static, marketing)
       │    ├─ app.ilinga.com       → web/dist (SPA, fallback to /index.html)
       │    ├─ api.ilinga.com       → 127.0.0.1:3001
       │    ├─ status.ilinga.com    → status/dist
       │    └─ *.portal.ilinga.com  → web/dist (SPA, customer-portal mode)
       │       (also accepts CNAMEs from tenant domains via on_demand_tls)
       ├─ PM2
       │    ├─ ilinga-api  (cluster, 2 instances, 127.0.0.1:3001)
       │    ├─ ilinga-workers (fork, 1 instance — render, webhook, retention, scan, embeddings)
       │    └─ n8n         (fork, 1 instance, 127.0.0.1:5678 — internal only)
       ├─ Local Valkey (127.0.0.1:6379) — BullMQ queues + SSE pub/sub
       └─ NO inbound exposure for n8n or Valkey
```

CockroachDB (with pgvector) and Cloudflare R2 are external managed services;
URLs in env. R2 uses S3-compatible API — same `aws-sdk` v3 client with
`endpoint=https://<account>.r2.cloudflarestorage.com` and `region=auto`.

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

# Object storage (Cloudflare R2; S3-compatible)
IL_S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
IL_S3_REGION=auto
IL_S3_BUCKET=ilinga-eu
IL_S3_ACCESS_KEY=...
IL_S3_SECRET_KEY=...
IL_S3_FORCE_PATH_STYLE=true

# Cookies / origins
IL_COOKIE_DOMAIN=.ilinga.com
IL_WEB_ORIGIN=https://app.ilinga.com
IL_API_ORIGIN=https://api.ilinga.com

# KMS / encryption
IL_KMS_KEK_HEX=<64 hex chars>

# Auth (magic link + Google only)
IL_SESSION_TTL_HOURS=24
IL_DEVICE_TRUST_DAYS=30
IL_MAGIC_LINK_TTL_MIN=15
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT=https://api.ilinga.com/v1/auth/google/callback

# Email — Resend primary + Postmark failover
IL_EMAIL_PRIMARY=resend
IL_EMAIL_FAILOVER=postmark
RESEND_API_KEY=...
POSTMARK_API_KEY=...
IL_EMAIL_FROM="Ilinga <noreply@ilinga.com>"
IL_EMAIL_REPLY_TO="team@ilinga.com"

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

## §15 Theming — light + dark with toggle (Phase 1 of frontend work)

Both themes ship from day one. Default = `system` (follow OS); user override persists in `users.ui_preferences.theme ∈ {light, dark, system}`. Token system is shared; values differ by `[data-theme]` attribute on `<html>`.

### 15.1 Tokens (`apps/web/src/styles/tokens.css`)

```css
/* Shared (theme-agnostic) */
:root {
  --signal-500: #D4622A;             /* terracotta accent — same in both themes */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-display: 'Söhne', 'Inter', sans-serif;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}

/* Dark (default) */
:root, [data-theme='dark'] {
  --surface-base:    #0E0B08;
  --surface-raised:  #15110D;
  --surface-overlay: #1B1611;
  --surface-sunken:  #0A0806;
  --border-subtle:   #2A231C;
  --border-strong:   #3A3026;
  --border-focus:    var(--signal-500);
  --text-primary:    #F4ECE2;
  --text-secondary:  #BFB1A0;
  --text-tertiary:   #877867;
  --text-inverse:    #0E0B08;
  --signal-50:  #2A1810;
  --signal-200: #6B3318;
  --signal-400: #B3501F;
  --signal-600: #E47A3F;
  --signal-700: #F09762;
  --success: #6FAE72;
  --warning: #D4A03C;
  --danger:  #D45A4A;
  --info:    #6FA3C7;
  --chart-1: #D4622A; --chart-2: #6FAE72; --chart-3: #D4A03C;
  --chart-4: #6FA3C7; --chart-5: #B47AC0;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,.5);
  --shadow-lg: 0 16px 40px rgba(0,0,0,.6);
  color-scheme: dark;
}

/* Light */
[data-theme='light'] {
  --surface-base:    #FBF7F1;        /* warm off-white */
  --surface-raised:  #FFFFFF;
  --surface-overlay: #F4EDE2;
  --surface-sunken:  #EFE7D9;
  --border-subtle:   #E8DDC9;
  --border-strong:   #C9B89C;
  --border-focus:    var(--signal-500);
  --text-primary:    #1A140E;
  --text-secondary:  #4A3F33;
  --text-tertiary:   #7A6B58;
  --text-inverse:    #FFFFFF;
  --signal-50:  #FBE7D9;
  --signal-200: #F2B58A;
  --signal-400: #DE7A3D;
  --signal-600: #B14F1E;
  --signal-700: #8C3D14;
  --success: #4F8C53;
  --warning: #B07A1A;
  --danger:  #B43A2C;
  --info:    #2E6E96;
  --chart-1: #B14F1E; --chart-2: #4F8C53; --chart-3: #B07A1A;
  --chart-4: #2E6E96; --chart-5: #8E5BA3;
  --shadow-sm: 0 1px 2px rgba(60,40,20,.08);
  --shadow-md: 0 4px 12px rgba(60,40,20,.10);
  --shadow-lg: 0 16px 40px rgba(60,40,20,.14);
  color-scheme: light;
}

html, body {
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

### 15.1a Theme runtime

- `apps/web/src/lib/theme.ts` exposes `useTheme() → {theme, setTheme}` with values `light|dark|system`.
- On boot, an inline `<script>` in `index.html` reads `localStorage.theme` (or `system`) and sets `data-theme` before paint to avoid FOUC.
- A pre-render server hint via cookie `il_theme` allows SSR-aware static HTML on the marketing site to ship the right theme on first paint.
- Settings → Workspace → Appearance toggles (`light | dark | follow system`); changes persist to `users.ui_preferences.theme` via `PATCH /auth/me/preferences` and to `localStorage`.
- `prefers-color-scheme` media listener applies `system` preference live.
- Reports always render on white paper (`@media print` forces light tokens) regardless of UI theme.

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

- User-configurable accent colours (Pro feature, deferred).
- Per-tenant brand themes for customer portals (Phase 11).

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

---

## §16 Email infrastructure

### 16.1 Provider strategy

- **Primary**: Resend (modern API, good DX, react-email templates).
- **Failover**: Postmark (high deliverability, separate IP reputation).
- **Marketing/lifecycle** (optional, deferred): Loops or Customer.io. Same abstraction.
- All providers behind `lib/email/index.ts` with `send(message)` returning normalised result. Provider chosen per-request by health (see §16.4).

### 16.2 Domain & deliverability

- Sending domains:
  - `notifications@ilinga.com` — transactional (auth, alerts, billing, reports)
  - `team@ilinga.com` — human-from-look replies (invites, stakeholder asks)
  - `marketing@ilinga.com` — newsletters, lifecycle (separate subdomain `mail.ilinga.com` with isolated reputation)
- DNS records (provisioned per region):
  - SPF: `v=spf1 include:resend.dev include:postmarkapp.com -all`
  - DKIM: per-provider keys, both published
  - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@ilinga.com; pct=100; adkim=s; aspf=s`
  - MTA-STS + TLS-RPT for inbound
  - BIMI (after DMARC `p=reject`)
- Bounce / complaint handling: webhook endpoints `/webhooks/email/{resend,postmark}` write to `email_events`; a soft-bounce retry policy and a hard-bounce suppression list (`email_suppressions`) prevent re-sends.
- Suppression types: `bounce_hard`, `bounce_soft`, `complaint`, `unsubscribe`, `manual`. Marketing sends honour all; transactional auth/billing sends ignore `unsubscribe` (legal — but block on `bounce_hard`).

### 16.3 Templates

- React Email (`@react-email/components`) — JSX templates in `apps/api/src/email/templates/*.tsx`.
- Built-in dark/light variants (mirrors §15 tokens).
- All templates have HTML + plain-text fallback (auto-derived).
- Catalog (initial):
  - `auth/magic-link`, `auth/otp`, `auth/totp-recovery-codes`, `auth/new-device`, `auth/password-changed`
  - `tenant/invite`, `tenant/seat-changed`, `tenant/owner-transfer`
  - `billing/checkout-receipt`, `billing/subscription-renewed`, `billing/payment-failed`, `billing/dunning-1/2/3`, `billing/balance-low`, `billing/credit-pack-purchased`
  - `cycle/closed`, `cycle/synthesis-complete`, `report/rendered`, `report/shared`
  - `stakeholder/feedback-request`, `stakeholder/reminder`
  - `data/export-ready`, `data/deletion-confirmation`
  - `system/incident-update`, `system/scheduled-maintenance`
- Each template version-tagged; `email_sends.template_version` recorded for audit.

### 16.4 Provider health & failover

- Health-check cron pings each provider every 60s; status stored in `email_provider_health (provider, status, last_ok_at, last_error)`.
- Send path: choose primary; on `5xx`, network error, or `>5s` latency, retry on failover. If both fail, enqueue to `email_outbox` and retry with exponential backoff (max 6 attempts, then `dead_letter`).
- Critical mail (auth, billing, security alerts) bypasses queue and tries both providers synchronously before erroring.

### 16.5 Schema additions

```sql
email_messages
  id UUID PK, tenant_id UUID NULL, user_id UUID NULL,
  template STRING NOT NULL, template_version INT NOT NULL,
  to_email STRING NOT NULL, from_email STRING NOT NULL,
  subject STRING NOT NULL, payload_hash STRING NOT NULL,
  provider STRING, provider_message_id STRING,
  status STRING NOT NULL,           -- queued|sent|delivered|bounced|complained|failed
  attempts INT, last_error STRING,
  sent_at, delivered_at, created_at
  index (tenant_id, created_at DESC), (provider_message_id)

email_events
  id UUID PK, message_id UUID FK, provider STRING,
  event STRING,                     -- delivered|bounced|complained|opened|clicked|unsubscribed
  payload JSONB, occurred_at TIMESTAMPTZ

email_suppressions
  id UUID PK, email STRING, kind STRING, reason STRING, source STRING, created_at
  unique (email, kind)
```

### 16.6 Rate limits & abuse

- Per-tenant cap: 10k transactional sends/day on Studio, 50k on Pro, 200k on Firm. 429s past cap.
- Per-recipient: max 5 magic-link/OTP requests per hour per email — enforced before send.
- Email change: requires verification of new address via OTP before flip; old address gets a notification with revert link (15 min).

### 16.7 Privacy

- Tracking pixels: off by default for transactional, opt-in per template flag. Disabled entirely for users who set `users.ui_preferences.email_tracking = false`.
- GDPR: email payload retained 30 days, then payload column purged (metadata kept for audit).

---

## §17 SMS infrastructure

### 17.1 Use cases

- 2FA via SMS (lower priority than TOTP; offered as fallback only).
- Critical security alerts (new-device sign-in for users who opt in).
- Stakeholder reminders (tenants on Pro+).

### 17.2 Providers

- **Primary**: Twilio (broadest coverage, programmable messaging).
- **Failover**: MessageBird (EU-based, fallback for EU residency).
- Africa routing: dispatch via local aggregator (Clickatell or Africa's Talking) when destination MCC is in Africa region — better cost + delivery.

Provider abstraction `lib/sms/index.ts` with `send(message, {regionHint})` selecting provider based on destination country prefix and tenant `region`.

### 17.3 Compliance

- Opt-in required (TCPA, GDPR ePrivacy, POPIA): users explicitly enable SMS in preferences with double-confirm.
- STOP / HELP keywords handled by provider; webhooks update `sms_suppressions`.
- Quiet hours: never send marketing SMS between 21:00–08:00 local time of destination.
- No marketing SMS by default; only transactional unless tenant opts a stakeholder list in.

### 17.4 Schema

```sql
sms_messages
  id UUID PK, tenant_id UUID NULL, user_id UUID NULL,
  template STRING, to_number STRING, from_number STRING,
  body STRING, provider STRING, provider_message_id STRING,
  status STRING, segments INT, cost_cents INT,
  attempts INT, last_error STRING,
  sent_at, delivered_at, created_at

sms_suppressions
  id UUID PK, phone STRING UNIQUE, reason STRING, source STRING, created_at
```

### 17.5 Removed — SMS OTP

SMS OTP is **not** supported (auth simplified to magic link + Google OAuth in
§4). SMS is only used for transactional alerts (security notices opt-in,
stakeholder reminders on Pro+).

### 17.6 Sender IDs

- Alphanumeric sender ID `Ilinga` where supported (most of EU, ZA, UK).
- Long codes (US, CA) registered through Twilio 10DLC; toll-free fallback during registration.

---

## §18 Notifications system

A unified notification fabric: one event → fan out to in-app, email, SMS, webhook based on recipient preferences and event severity.

### 18.1 Architecture

```
event emitted
   ▼
notification dispatcher
   ├─ in-app (websocket/SSE + persisted in `notifications`)
   ├─ email  (§16)
   ├─ sms    (§17, only if severity ≥ alert AND user opted in)
   └─ webhook (tenant subscribers, §3.12)
```

### 18.2 Schema

```sql
notification_topics            -- catalog (system-defined)
  code STRING PK,              -- e.g. 'cycle.synthesis_complete'
  display_name STRING,
  default_channels JSONB,      -- e.g. ['inapp','email']
  severity STRING,             -- info|alert|critical
  description STRING

notification_preferences
  user_id UUID PK part,
  topic_code STRING PK part,
  channels JSONB,              -- override of default_channels
  digest STRING,               -- 'instant'|'hourly'|'daily'

notifications                  -- in-app inbox
  id UUID PK, tenant_id UUID, user_id UUID,
  topic_code STRING, severity STRING,
  title STRING, body STRING, link STRING,
  read_at TIMESTAMPTZ, dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
  index (user_id, read_at, created_at DESC)

notification_dispatch_log
  id UUID PK, notification_id UUID, channel STRING,
  ref_table STRING, ref_id UUID,    -- email_messages.id or sms_messages.id
  status STRING, error STRING, dispatched_at
```

### 18.3 Routes

| Method | Path                                  | Purpose                          |
| ------ | ------------------------------------- | -------------------------------- |
| GET    | `/notifications`                      | inbox (paginated)                |
| POST   | `/notifications/:id/read`             | mark read                        |
| POST   | `/notifications/read-all`             | mark all read                     |
| GET    | `/notifications/preferences`          | list                             |
| PUT    | `/notifications/preferences`          | bulk update                      |
| GET    | `/notifications/stream`               | SSE stream of unread events       |

### 18.4 Digesting

- Users on `digest=hourly|daily` get a single email summarising notifications for that window. In-app remains real-time.
- `cron/digest.ts` runs hourly/daily and emits `digest.email_sent` audit event.

### 18.5 Critical-path overrides

- Topics flagged `severity=critical` (security alerts, payment failures, data deletion confirmations) ignore digest and always send instantly via email + in-app.

---

## §19 Usage-based billing depth (extends §8)

### 19.1 Subscription lifecycle states

| State        | Triggered by                    | UI behaviour                                                |
| ------------ | ------------------------------- | ----------------------------------------------------------- |
| `trialing`   | new tenant on Studio/Pro trial   | full access, banner showing days remaining                  |
| `active`     | invoice paid                     | normal                                                      |
| `past_due`   | invoice failed                   | non-blocking warning + dunning emails                        |
| `unpaid`     | dunning exhausted                | read-only mode (existing reports viewable; no new synthesis) |
| `canceled`   | tenant cancels (effective at period end) | banner; access continues until `current_period_end`   |
| `paused`     | admin or downgrade in flight     | similar to read-only                                         |

State machine enforced server-side in `subscriptions.service.ts`; transitions audit-logged.

### 19.2 Metering (usage events)

Every credit-consuming operation emits a metering event to `usage_events`:

```sql
usage_events
  id UUID PK, tenant_id UUID FK,
  event_kind STRING,          -- prompt_run|render|resynth|byo_orchestration|n8n_job|export|api_call
  units INT,                  -- credits charged (0 for orchestration-only)
  ref_table STRING, ref_id UUID,
  prompt_id UUID NULL, prompt_version INT NULL,
  module_id UUID NULL, report_type_id UUID NULL,
  endpoint_id UUID NULL, model_id STRING,
  tokens_in INT, tokens_out INT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
  index (tenant_id, occurred_at DESC), (event_kind, occurred_at)
```

`credit_ledger` remains the financial source of truth; `usage_events` is the analytical fact table (one row per business event, joinable for §20 reports). Both written in the same transaction.

### 19.3 Trials

- 14-day Pro trial available once per tenant (tracked via `tenant_trials (tenant_id, plan_code, started_at, ended_at, ended_reason)`).
- No card required; trial allowance = 200 credits.
- 3 days before trial end: `trial.ending_soon` notification + email.
- Conversion checkout pre-fills the chosen plan.

### 19.4 Coupons & promo codes

```sql
coupons
  id UUID PK, code STRING UNIQUE, kind STRING,    -- percent_off|amount_off|extend_trial
  value INT, currency STRING, max_redemptions INT, redemptions INT,
  applies_to JSONB,                                -- {plan_codes:[...], pack_codes:[...]}
  expires_at TIMESTAMPTZ, active BOOL, dodo_coupon_id STRING,
  created_by UUID, created_at

coupon_redemptions
  id UUID PK, coupon_id UUID, tenant_id UUID, ref_table STRING, ref_id UUID, redeemed_at
```

Checkout passes `coupon_code`; API validates → forwards `dodo_coupon_id` to Dodo Checkout. Redemption recorded on `payment.succeeded`.

### 19.5 Tax

- Dodo Payments calculates sales tax / VAT / GST per Dodo's configuration; we surface the line items in invoice display.
- `tenants.vat_id` collected at checkout for B2B (reverse-charge in EU). Stored encrypted-at-rest only if classified sensitive in destination jurisdiction.
- POPIA: ZA VAT 15% applied for ZA tenants.

### 19.6 Dunning

- `payment.failed` from Dodo → state `past_due`.
- Automated dunning schedule (configurable per plan):
  - T+0: email `billing/dunning-1`
  - T+3d: email `billing/dunning-2` + in-app banner
  - T+7d: email `billing/dunning-3` + SMS to billing contact (if opted in) + Slack/webhook
  - T+14d: state `unpaid` → read-only mode
  - T+30d: subscription canceled, downgrade to `free` at next period
- Dunning suspended by successful retry (Dodo Smart Retries) or manual `update card`.

### 19.7 Card update / retry

- `GET /billing/portal` (Dodo billing portal) for self-service card updates.
- `POST /billing/retry-payment/:invoice_id` triggers immediate retry once card updated.

### 19.8 Refunds & credits adjustments

- `POST /admin/tenants/:id/credits/adjust {delta, reason, note}` posts manual `credit_ledger` row (auditor visible).
- Refunds via Dodo Payments dashboard; webhook `payment.refunded` → `credit_ledger` `delta = -original`.
- Goodwill credits (no money movement): admin-only, audit-logged with required note.

### 19.9 Plan switching

- Upgrades: prorated immediately (Dodo handles), credit allowance topped to new plan's monthly amount.
- Downgrades: take effect next period; if new seat limit < current, suspension policy in §5.2.
- Cancellation: at period end; reactivation possible until cancellation effective.

### 19.10 BYO endpoint billing

Two-tier credit charging:
- **Orchestration credits**: small fixed cost per prompt run / render regardless of where tokens are billed (covers our infra + agent overhead).
- **Token credits**: only when using system AI endpoint. With BYO, tokens billed by tenant's provider; we charge orchestration only.

`prompts.credit_cost` becomes a JSON: `{system: 8, byo: 2}`. The charger picks based on routed endpoint.

### 19.11 Routes (new)

| Method | Path                                       | Purpose                                |
| ------ | ------------------------------------------ | -------------------------------------- |
| POST   | `/billing/coupons/validate`                | check code, return discount preview     |
| GET    | `/billing/trials/eligibility`              | can this tenant start a trial?          |
| POST   | `/billing/trials/start`                    | start trial                              |
| GET    | `/billing/usage`                           | period burn, projection, forecast        |
| GET    | `/billing/invoices/:id/preview`            | upcoming invoice with proration          |

---

## §20 Credit usage reporting & analytics

The platform must answer: *how much did each report cost this cycle? where are credits going? which prompts are expensive? which users are heavy?*

### 20.1 Aggregations

Materialised views (Cockroach `MATERIALIZED VIEW` + manual refresh cron, or scheduled rollup tables refreshed every 5 min):

```
mv_usage_daily        (tenant_id, day, event_kind, sum_units, count)
mv_usage_by_prompt    (tenant_id, day, prompt_id, prompt_version, sum_units, runs, p50_latency_ms, p95)
mv_usage_by_module    (tenant_id, day, module_id, sum_units, runs, success_rate)
mv_usage_by_report    (tenant_id, day, report_type_id, template_id, renders, sum_units)
mv_usage_by_user      (tenant_id, day, actor_user_id, sum_units, count)
mv_usage_by_endpoint  (tenant_id, day, endpoint_id, sum_units, tokens_in, tokens_out, error_rate)
```

### 20.2 Tenant-facing reporting

UI in `routes/_app/credits/usage/`:
- Burn-rate chart (daily, last 30/90 days) split by event kind.
- Top 10 prompts/modules by cost.
- Cost per cycle (per venture, last 4 cycles).
- Per-report cost breakdown (e.g. "GTM Playbook: 60 cr — 42 prompt runs, 1 render"). Drill-down lists each `prompt_run` with status, latency, credits.
- Per-user usage (helps owners attribute spend across team).
- BYO vs system endpoint split (orchestration vs token credits).
- CSV export endpoint for finance.

### 20.3 Routes

| Method | Path                                            | Purpose                                  |
| ------ | ----------------------------------------------- | ---------------------------------------- |
| GET    | `/usage/summary?period=30d`                     | top-line burn, allowance, projection      |
| GET    | `/usage/by-prompt?period=30d`                   | rollup                                    |
| GET    | `/usage/by-module?period=30d`                   |                                           |
| GET    | `/usage/by-report?period=30d`                   |                                           |
| GET    | `/usage/by-user?period=30d`                     |                                           |
| GET    | `/usage/by-endpoint?period=30d`                 |                                           |
| GET    | `/usage/cycles/:cid/breakdown`                  | per-cycle cost detail                     |
| GET    | `/usage/cycles/:cid/reports/:rid/breakdown`     | per-report cost detail (prompt-by-prompt) |
| GET    | `/usage/export.csv?period=30d`                  | streaming CSV                             |

### 20.4 Per-report config visibility

Each `report_types` row exposes a `cost_estimator`:
- For a given cycle, given current content key coverage, estimate render cost using `prompts.credit_cost` × predicted prompt runs × token-mode multipliers.
- Surfaced in the Reports grid as "≈ 35–55 cr (BYO) / 90–140 cr (system)" before commit.

### 20.5 Forecasting

- Linear projection of period burn vs allowance; alert if projection > allowance.
- "Days until allowance exhausted at current burn" surfaced on dashboard widget.
- Notification topics: `credits.balance_low` (≤10%), `credits.projection_over_allowance`.

### 20.6 Admin (platform)

- `/admin/usage/global` shows aggregate spend, top tenants by burn, prompt-level performance.
- Anomaly detection: flag tenants with 5× day-over-day burn increase for support outreach.

---

## §21 n8n Agent Designer (in-app)

The platform exposes an in-app workflow editor so platform admins (and Pro+ tenants on advanced plans) can design, version, and deploy n8n workflows without leaving Ilinga.

### 21.1 Goals

- Manage the canonical workflows under `infra/n8n/workflows/` (interview-followup, module-synthesis, cross-module-reducer, report-prerender, competitor-scrape, artifact-extract) as first-class versioned objects.
- Allow tenant-specific overrides on Pro+ plans.
- Version, diff, dry-run, promote.

### 21.2 Schema

```sql
agent_workflows
  id UUID PK, tenant_id UUID NULL,        -- NULL = system
  code STRING NOT NULL,                    -- 'wf-interview-followup' etc.
  display_name STRING, description STRING,
  status STRING,                            -- 'draft'|'staged'|'active'|'archived'
  current_version INT, created_by UUID, created_at, updated_at
  unique (COALESCE(tenant_id,'00000000-...'), code)

agent_workflow_versions
  id UUID PK, workflow_id UUID FK, version INT,
  n8n_definition JSONB NOT NULL,            -- exported n8n workflow JSON
  required_inputs JSONB, produced_outputs JSONB,
  required_keys JSONB,                       -- content keys consumed
  produces_keys JSONB,                       -- content keys produced
  notes STRING,
  promoted_at TIMESTAMPTZ, promoted_by UUID,
  created_by UUID, created_at
  unique (workflow_id, version)

agent_workflow_runs                          -- mirrors n8n_jobs but agent-centric
  id UUID PK, workflow_version_id UUID FK,
  tenant_id UUID, cycle_id UUID NULL,
  inputs JSONB, outputs JSONB,
  n8n_execution_id STRING, status STRING,
  started_at, completed_at,
  error STRING
```

### 21.3 Editor UX (admin route `/admin/agents`)

- **List**: workflows (system + per-tenant) with current version, last run, success rate.
- **Editor**: embed a stripped-down React Flow / DAG view that mirrors n8n nodes; advanced users can switch to "JSON" mode and paste exported n8n JSON.
- **Inputs panel**: declared `required_inputs` (e.g. `{cycleId, moduleCode}`) and `required_keys` (content keys); editor warns if a node references an undeclared key.
- **Outputs panel**: declared content keys produced; renderer/synthesis pipeline uses these to wire downstream.
- **Sandbox run**: pick a real cycle, run with `dry_run=true` against a copy of n8n that posts to a sandbox callback URL; results displayed as a side-by-side diff with current production version.
- **Promote**: changes status from `draft` → `staged` → `active`; deactivates prior version automatically. Audit-logged.

### 21.4 Deployment

- `agent_workflow_versions.n8n_definition` is the source of truth.
- On promote, API calls n8n REST API: `POST /workflows` (or `PUT /workflows/:id`), activates it, and stores the returned n8n workflow ID in `agent_workflows.n8n_workflow_id`.
- For tenant-specific overrides: workflow is created in n8n with name suffixed `__tenant_<id>`; dispatcher routes to it for that tenant.

### 21.5 Routes

| Method | Path                                      | Purpose                       |
| ------ | ----------------------------------------- | ----------------------------- |
| GET    | `/admin/agents`                           | list workflows                 |
| POST   | `/admin/agents`                           | create draft                  |
| GET    | `/admin/agents/:id`                       | fetch with versions            |
| POST   | `/admin/agents/:id/versions`              | new version (uploaded JSON)    |
| POST   | `/admin/agents/:id/versions/:v/dry-run`   | sandbox execute               |
| POST   | `/admin/agents/:id/versions/:v/promote`   | activate                      |
| GET    | `/admin/agents/:id/runs`                  | run history                   |
| POST   | `/tenants/:tid/agents`                    | tenant-side override (Pro+)    |

### 21.6 Guardrails

- Static analysis on uploaded JSON: reject workflows that reference unauthorised credentials, external HTTP nodes targeting non-allowlisted hosts, or `Execute Command` nodes (security).
- Quotas: tenant overrides limited (Pro = 3 custom workflows, Firm = 10).
- Rollback: any active workflow can be rolled back to a prior `active` version in <5s.

---

## §22 Export pipeline (extends §10)

Reports + outputs must export across multiple formats reliably and accessibly.

### 22.1 Supported formats

| Format | Use case                              | Engine                                              |
| ------ | ------------------------------------- | --------------------------------------------------- |
| PDF    | Default deliverable                   | Playwright headless Chromium → `page.pdf()`         |
| HTML   | Web-shareable rendered report         | Direct from Handlebars → static HTML file           |
| DOCX   | Editable Word document                | `docx` (npm) — translate AST from Handlebars output  |
| PPTX   | Investor decks                        | `pptxgenjs` — admin-defined slide template per report |
| MD     | Plain text / re-import                | Server-side `turndown` from rendered HTML            |

`report_renders.format` enum extended; each render produces a primary format and optionally siblings stored alongside (`report_render_artifacts`).

```sql
report_render_artifacts
  id UUID PK, render_id UUID FK, format STRING,
  storage_key STRING, size_bytes BIGINT, sha256 STRING, created_at
  unique (render_id, format)
```

### 22.2 Routes

| Method | Path                                                   | Purpose                  |
| ------ | ------------------------------------------------------ | ------------------------ |
| GET    | `/cycles/:cid/reports/:rid/download.:fmt`              | streams chosen format     |
| POST   | `/cycles/:cid/reports/:rid/regenerate?formats=pdf,docx` | regenerate sibling formats |

### 22.3 PDF specifics

- A4 + Letter both supported; user/template chooses.
- Embedded fonts (subset only, license-permissive) shipped under `apps/api/assets/fonts/`.
- Page numbering, header/footer, ToC via Handlebars helpers.
- Watermark: optional per-tenant or per-share-link (`{{watermark text='CONFIDENTIAL'}}`); diagonal repeating SVG with low opacity.
- PDF/A-2 mode for archival when tenant flag set.
- Tagged PDF (accessibility) — Playwright `tagged: true`; alt-text from `img` tags must be present (linter step in template validation).

### 22.4 Signed URLs

- All download endpoints 302 to S3 presigned GET (5-min TTL by default; configurable down to 60s).
- Public share links (§10): support optional password (bcrypt hash), expiry, and per-link watermark.
- Audit logged (`report.downloaded`, `report.shared.opened`).

### 22.5 Accessibility

- Linter runs against rendered HTML before PDF: heading hierarchy, alt text, table headers, contrast (axe-core).
- Failing a hard rule blocks render; soft rules become warnings on the render result.

### 22.6 Storage lifecycle

- Render artifacts retained for cycle + 1 year; then moved to cold storage if tenant retains, else purged.
- Tenant export bundles (data export job, §12) include all artifacts.

---

## §23 AI model registry (extends §9)

A registry catalogues every model that may serve a workload — both system-managed and tenant-supplied — so routing, cost estimation, and fallbacks work uniformly.

### 23.1 Schema

```sql
ai_models                                    -- catalog (system + tenant)
  id UUID PK, tenant_id UUID NULL,           -- NULL = system catalog entry
  provider STRING NOT NULL,                  -- openai|azure|anthropic|bedrock|vertex|ollama|openai_compat|fine_tune
  model_id STRING NOT NULL,                  -- provider-specific id
  display_name STRING NOT NULL,
  family STRING,                             -- gpt-4|claude|llama|mistral|...
  capabilities JSONB,                        -- {text:true, json_mode:true, vision:true, embeddings:false, ...}
  context_window INT, max_output_tokens INT,
  cost_per_1k_in_cents NUMERIC, cost_per_1k_out_cents NUMERIC,  -- system tier; tenant BYO can be null
  status STRING,                             -- 'active'|'deprecated'|'preview'
  notes STRING, created_at, updated_at
  unique (COALESCE(tenant_id,'00000000-...'), provider, model_id)

ai_model_aliases                              -- routing aliases (e.g. 'flagship' → openai/gpt-4o)
  alias STRING PK part, tenant_id UUID PK part,
  model_id UUID FK
```

`tenant_ai_endpoints` now FKs to `ai_models.id` instead of free-text `model_id`. Tenants pick from "supported models" dropdown that combines system catalog + their own entries.

### 23.2 Custom models

- Fine-tunes: tenants register their fine-tuned model under their endpoint (`provider='fine_tune'` + base `family`); we treat as a regular routable model.
- Self-hosted via Ollama: endpoint URL points to internal Ollama; capabilities/context inferred from model id and editable.
- OpenAI-compat (groq, deepinfra, together, anyscale, lambda, etc.): generic adapter; tenant supplies endpoint URL + key + model id.

### 23.3 Embeddings & retrieval

A separate workload `embeddings` was already in routing (§9). Catalogue specific embedding models:
- OpenAI `text-embedding-3-large` / `-small`
- Cohere `embed-multilingual-v3`
- Local: `bge-m3` via Ollama

Vector store: **CockroachDB pgvector** (confirmed supported per
[cockroachlabs.com/blog/vector-search-pgvector-cockroachdb](https://www.cockroachlabs.com/blog/vector-search-pgvector-cockroachdb)).
Embeddings live in the main DB — no separate Postgres sidecar.
`CREATE EXTENSION IF NOT EXISTS vector;` runs in the first migration. Tables:

```sql
artifact_embeddings
  id UUID PK, tenant_id UUID, cycle_id UUID, artifact_id UUID,
  chunk_index INT, chunk_text STRING, embedding VECTOR(1024),
  model_id UUID FK, created_at

answer_embeddings
  id UUID PK, tenant_id UUID, cycle_id UUID, answer_id UUID,
  embedding VECTOR(1024), model_id UUID FK
```

Used by extraction (§6), n8n synthesis prompts ("similar prior answers"), and stakeholder feedback dedup.

### 23.4 Routing extensions

- Per-workload routing now maps to a model alias (e.g. `report_render → flagship`, `interview_followup → fast`). Aliases resolve to actual `ai_models` per tenant policy.
- Cost-aware routing (Phase 14): if projected cost > tenant budget for the cycle, fallback to cheaper alias.

### 23.5 Routes

| Method | Path                                | Purpose                              |
| ------ | ----------------------------------- | ------------------------------------ |
| GET    | `/ai-models`                        | list (system + tenant)                |
| POST   | `/ai-models`                        | tenant adds a custom model            |
| PATCH  | `/ai-models/:id`                    |                                      |
| DELETE | `/ai-models/:id`                    |                                      |
| GET    | `/ai-models/aliases`                | tenant alias map                      |
| PUT    | `/ai-models/aliases`                | bulk update                           |
| GET    | `/admin/ai-models`                  | manage system catalog                  |

### 23.6 Migration mapping (existing → registry)

`tenant_ai_endpoints.model_id` → on migration, upsert into `ai_models` (tenant scope) and replace with FK. Existing prototype values like `gpt-4o-2024-11-20` and `claude-sonnet-4` map to system catalog entries; unmapped values fall to tenant scope automatically.

---

## §24 Observability

### 24.1 Logs

- API + workers use Pino, structured JSON, with `request_id`, `tenant_id`, `user_id`, `route`, `latency_ms`, `status_code` fields.
- Sensitive fields redacted via Pino `redact` config.
- Shipped to a managed log store (Better Stack / Loki / Datadog — env-selectable; default Better Stack for cost).
- Retention 30 days hot, 365 days cold.

### 24.2 Metrics

- Prometheus exposition at `/internal/metrics` (bound to localhost only; scraped by node-exporter sidecar).
- Counters/histograms:
  - HTTP: `http_requests_total{route,method,status}`, `http_request_duration_seconds{route,method}`.
  - Auth: `auth_signin_total{method,status}`, `auth_failed_login_total`.
  - Synthesis: `prompt_runs_total{prompt_code,status}`, `prompt_run_duration_seconds`, `prompt_run_tokens_total{direction,model}`.
  - Render: `report_render_duration_seconds{report_type}`, `report_render_failures_total`.
  - Credits: `credits_charged_total{reason}`, `credits_balance_gauge` per tenant.
  - Billing: `dodo_webhook_total{event}`, `dunning_state_total`.
  - Email/SMS: `email_send_total{provider,status}`, `sms_send_total{provider,status}`.
- Dashboards (Grafana JSON committed to `infra/grafana/`): Auth Health, Synthesis Throughput, Render Latency, Billing Funnel, Email Deliverability, Tenant Top-Burn.

### 24.3 Traces

- OpenTelemetry SDK; OTLP export to Tempo / Honeycomb / Datadog.
- Trace IDs propagated via `traceparent` header (W3C); attached to log lines.
- Spans on: HTTP handlers, DB queries (Drizzle instrumentation), AI provider calls, n8n dispatches, Playwright renders.

### 24.4 Errors

- Sentry (`@sentry/node`, `@sentry/react`) with environment + release tags.
- Source maps uploaded on web build.
- PII scrubbing rules (email, IP) configured.
- Error budget: synthesis pipeline 99.5% / month → alerts when burn exceeds 2× rate.

### 24.5 Uptime monitoring

- Synthetic probes from 3 regions every 60s on:
  - `https://app.ilinga.com/healthz` (HTTP 200)
  - `https://api.ilinga.com/healthz` (HTTP 200, returns DB + S3 + Redis OK)
  - `https://api.ilinga.com/v1/healthz/n8n` (internal OK ping)
- Cockroach Cloud + Dodo Payments reachability via deep checks every 5 min.
- Failures > 2 consecutive → PagerDuty/Opsgenie page; status page (§29) auto-incidents after 3 consecutive.

### 24.6 SLOs

| Service              | Target    | Window  |
| -------------------- | --------- | ------- |
| API HTTP success     | 99.9%     | 30d     |
| Auth sign-in p95     | < 500ms   | 30d     |
| Synthesis prompt run p95 | < 8s   | 30d     |
| Report render p95    | < 30s     | 30d     |
| Email delivery       | 99.5%     | 30d     |
| Webhook delivery     | 99% within 5 min | 30d |

---

## §25 Search & global command palette

### 25.1 Backend

- Phase 1: Cockroach trigram (`pg_trgm` is not available in CRDB; use `STRING` indexes + `LIKE`/`ILIKE` with computed lower-cased columns and `WHERE col LIKE '%q%'` over scoped result sets).
- Phase 2 (when scale demands): Meilisearch (managed) syncing relevant indices via outbox; behind feature flag.

### 25.2 Indexed entities

- Ventures (name, brief summary)
- Cycles (cycle number, status)
- Modules / module outputs (narrative excerpt)
- Reports (display name, report type)
- Content keys (code, value text)
- Audit log (action, actor email)

All scoped to `request.tenant`.

### 25.3 Routes

| Method | Path                                | Purpose                                |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/search?q=...&types=...`           | global search                          |
| GET    | `/search/recent`                    | recent results for the user             |

### 25.4 Command palette (web)

- `⌘K` / `Ctrl+K` opens palette across the app shell (matches prototype's "Search modules, reports… ⌘K" affordance).
- Supports:
  - Search (calls `/search`)
  - Navigation actions ("Go to Ventures", "Open Settings → AI endpoints")
  - Recent items
  - Quick actions ("Create venture", "Render report", "Top up credits")
- Implementation: `cmdk` (Vercel) component bound to a router-aware action registry. Keyboard-only operable; ARIA `role=combobox`/`listbox` correct.

---

## §26 Backup & disaster recovery

### 26.1 Database

- Cockroach Cloud automatic backups: full daily, incremental hourly, retained 30 days.
- Manual backups before risky migrations: `BACKUP DATABASE ilinga TO 's3://ilinga-backups/<region>/<timestamp>' AS OF SYSTEM TIME ...`.
- Cross-region replication for `tenants.region` HA.
- Restore drill: monthly automated restore into a staging cluster + sanity test suite (`infra/scripts/restore-drill.sh`); evidence captured in `infra/evidence/`.

### 26.2 Object storage

- S3 versioning enabled on `IL_S3_BUCKET`.
- Object lock (compliance mode) on `audit_log` exports and SOC 2 evidence prefixes.
- Lifecycle: artifacts purged on retention; reports archived to cold storage after 1 year if tenant opts.

### 26.3 Configuration & secrets

- Env files versioned in private ops repo (encrypted with `sops` + age keys).
- KEK rotation plan annual; rotation playbook in `docs/RUNBOOK.md`.

### 26.4 RTO / RPO targets

| Tier             | RTO    | RPO    |
| ---------------- | ------ | ------ |
| API + Web        | 1 hour | 0 (stateless) |
| Cockroach data   | 2 hours | 1 hour |
| Object storage   | 4 hours | 1 hour |
| n8n workflows    | 30 min | 0 (definitions in git) |

### 26.5 Runbooks

`docs/RUNBOOK.md` covers: VM compromise, leaked KEK, Dodo outage, AI provider outage, mass deletion mistake, ransomware, cert expiry. Each playbook includes detection, mitigation, comms.

---

## §27 Reserved (formerly SSO + SCIM)

SSO (SAML / OIDC) and SCIM provisioning are **out of scope at GA**. Reserved
for a future Enterprise phase if/when signed enterprise customers require it.
Auth at GA = magic link + Google OAuth only (§4). Tables `tenant_idp` and
`tenant_idp_domains` are not created.

---

## §28 API tokens & developer platform

### 28.1 Personal access tokens (PATs)

For users to call the API programmatically.

```sql
api_tokens
  id UUID PK, user_id UUID FK,
  name STRING, prefix STRING,             -- e.g. 'ila_live_'
  hash STRING UNIQUE,                      -- sha256 of full token
  scopes JSONB,                            -- list of permitted scopes
  tenant_id UUID NULL,                     -- if tenant-scoped
  expires_at TIMESTAMPTZ NULL,
  last_used_at TIMESTAMPTZ, created_at, revoked_at
```

- Token format: `ila_live_<32 base32 chars>` (or `ila_test_` for sandbox).
- Shown once at creation; never retrievable again.
- Scopes: `read:ventures`, `write:ventures`, `read:reports`, `render:reports`, `read:credits`, `webhook:manage`, `admin:*` (platform admins only).

### 28.2 Service accounts

Tenant-scoped non-human accounts:

```sql
service_accounts
  id UUID PK, tenant_id UUID FK, display_name STRING, role STRING,
  created_by UUID, created_at, deactivated_at
```

PATs can be issued for service accounts; counted against seat limit (1 SA = 1 seat) on lower plans, free on Firm.

### 28.3 OpenAPI

- Source of truth: zod schemas in `packages/shared-types`.
- `zod-to-openapi` generates `apps/api/openapi.yaml` at build.
- Served at `https://api.ilinga.com/v1/openapi.yaml`; Swagger UI at `https://api.ilinga.com/docs` (public).

### 28.4 SDKs

- TypeScript SDK auto-generated from OpenAPI via `openapi-typescript` and a thin runtime in `packages/sdk-js`. Published to npm as `@ilinga/sdk`.
- Python SDK via `openapi-python-client`, published to PyPI.
- Versioning aligned to API version.

### 28.5 Routes

| Method | Path                                | Purpose                        |
| ------ | ----------------------------------- | ------------------------------ |
| GET    | `/api-tokens`                       | list (no plaintext)             |
| POST   | `/api-tokens`                       | create — returns token once     |
| DELETE | `/api-tokens/:id`                   | revoke                          |
| GET    | `/service-accounts`                 |                                |
| POST   | `/service-accounts`                 |                                |
| POST   | `/service-accounts/:id/tokens`      | issue PAT for SA                |
| GET    | `/openapi.yaml`                     | spec                            |
| GET    | `/docs`                             | Swagger UI                       |

### 28.6 Rate limits per token

- Per-token bucket: 600 req/min default, configurable per plan.
- 429 with `Retry-After`. Headers `X-RateLimit-Remaining`, `X-RateLimit-Reset` on every response.

---

## §29 Public status page & incident comms

### 29.1 Status page

- Hosted at `https://status.ilinga.com`.
- Static React page (separate small build) reading from a tiny status API:
  - Component list: API, Web, Synthesis, n8n, Reports, Email, SMS, Payments.
  - Current status per component: operational | degraded | partial outage | major outage.
  - Historical incidents (last 90 days).
- Backed by `incidents` and `incident_updates` tables; admin UI in `/admin/incidents`.

### 29.2 Schema

```sql
incidents
  id UUID PK, slug STRING UNIQUE,
  title STRING, started_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ,
  severity STRING, components JSONB,
  status STRING                           -- investigating|identified|monitoring|resolved

incident_updates
  id UUID PK, incident_id UUID FK,
  status STRING, body STRING,             -- markdown
  created_by UUID, created_at
```

### 29.3 Comms

- Subscribers (email/SMS) via `status_subscriptions (email, sms_phone, scope, verified_at)`.
- On new incident or update: dispatch via §18 notifications fabric (separate "platform announcements" topic).
- Tenants can subscribe their team automatically (Settings → Team → Auto-subscribe to incidents).

### 29.4 Postmortems

- Resolved incidents auto-prompt admins for a postmortem markdown; published at `/incidents/:slug` after review.
- SOC 2 evidence: postmortem within 7 days for severity ≥ major.

---

## §30 Internationalisation & accessibility

### 30.1 i18n

- Library: `i18next` + `react-i18next`.
- Source language: en. Translations in `apps/web/locales/<lang>/<namespace>.json`.
- Namespaces: `common`, `auth`, `dashboard`, `interview`, `synthesis`, `reports`, `settings`, `legal`.
- Initial languages: en, fr, es, pt, de, af, zu (POPIA helpful). Marketing site adds nl, sv as demand grows.
- Date/number/currency: `Intl.*` APIs; user/tenant locale + timezone respected (`users.locale`, `tenants.timezone`).
- RTL: not in initial scope; CSS uses logical properties (`margin-inline-start`) anyway for future-proofing.
- Translation workflow: Crowdin / Lokalise sync via CI; PR opened on new strings.
- Server messages (validation, errors): translated by the API using `Accept-Language`; API includes a `code` for client-side translation as fallback.

### 30.2 Accessibility (WCAG 2.2 AA)

- Component library passes `axe-core` rules in test suite (Vitest + Playwright).
- Keyboard-only navigation tested for every page (focus visible, no traps, skip-to-content).
- Screen-reader: aria roles correct on app shell, tab panels, dialogs, the interview question, the synthesis pipeline graph, the reports grid.
- Colour contrast: 7:1 body / 4.5:1 secondary in both light + dark; checked in CI via Playwright screenshots + `axe`.
- Reduced motion: `@media (prefers-reduced-motion)` disables animation-heavy transitions; the pipeline graph swaps animated edges for static.
- Captions/transcripts: not applicable (no audio/video) at v1.
- Alt text required on tenant-uploaded images (template lint, §22).

### 30.3 a11y on PDFs

- Tagged PDFs (§22.3); language tag set; reading order matches DOM order; tables have proper `<th>` and scope.
- Test corpus: Adobe Acrobat Pro accessibility checker run in CI on a sample render per report type.

---

## §31 Anti-abuse hardening

### 31.1 Bot defence

- hCaptcha invisible challenge on signup, magic-link request, OTP request, password reset, contact forms.
- Cloudflare Turnstile fallback (configurable).
- Risk score from IP reputation list (AbuseIPDB / Spur) + `Sec-CH-UA` headers; high-risk requests force visible challenge.

### 31.2 Account takeover defence

- New-device sign-in detection: device fingerprint via `il_device` cookie; unknown device → email + SMS (if enabled) alert with one-click "this wasn't me" → force sign-out everywhere + password reset.
- Impossible-travel: sign-in from country B within 30 min of country A → force step-up + alert.
- Password breach check on set/change via HIBP k-anonymity API.
- Auto-lock after 10 failed attempts in 15 min (already in §4.7).
- Step-up auth required for: change email/password, disable MFA, view recovery codes, export data, delete cycle/tenant, rotate AI endpoint keys, configure SSO.

### 31.3 Toll-fraud / OTP-pumping

- SMS OTP gated by IP-level limits + per-phone limits + global tenant cap (already in §17.5).
- Anomaly detector: if a single tenant generates >100 SMS OTPs to never-seen numbers in <1h → auto-pause SMS for that tenant + alert ops.
- High-cost destinations (premium-rate prefixes, satellite) blocked by default.

### 31.4 Webhook abuse

- Outbound webhooks: SSRF protection — destination URLs resolved server-side; private/loopback ranges blocked unless tenant flag `allow_internal_webhooks` set + admin approved.
- Max payload 256kb, max attempts 8 with exponential backoff, dead-letter after.

### 31.5 Render abuse

- Hard cap per tenant: 50 renders/hour Studio, 200/hour Pro, 1000/hour Firm.
- Force `?force=true` rate-limited to 10/hour to prevent credit-burn cycles.

### 31.6 Sandbox isolation

- Handlebars rendering (§10.2), uploaded n8n JSON (§21.6), tenant-supplied embedding endpoints — all isolated per request, no shared state.

### 31.7 Secrets handling

- API keys, webhook secrets shown to user once at creation. Never logged.
- Audit trail captures only token id + last 4 chars of public prefix.
- Compromise response: rotate via runbook within 30 min of report; affected tenants notified in 4 hours.

### 31.8 Web security headers (recap of Caddy + app)

- HSTS `max-age=63072000; includeSubDomains; preload`.
- CSP strict (no inline scripts; nonces for any required inline).
- COOP `same-origin`, COEP `require-corp` on app subdomain.
- Permissions-Policy disabling unused features (camera, microphone, geolocation).
- `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

### 31.9 Secrets in code & supply chain

- `git-secrets` pre-commit hook + GitHub `push protection` enabled.
- Dependency scanning: `pnpm audit` in CI, Renovate for upgrades, Snyk monitoring.
- Container/host scanning: Trivy scan on the VM image weekly.
- SBOM generated (`@cyclonedx/cyclonedx-npm`) and uploaded to compliance vault.

### 31.10 Pen-testing & bug bounty

- Annual external pentest (required for SOC 2 Type II).
- Public vulnerability disclosure policy at `/.well-known/security.txt` and `/legal/security`.
- Private bug bounty (HackerOne / Intigriti) once GA stable.

---

## §32 End-to-end completeness checklist

The system is "done" when every item below is green. Use this as the QA gate
before opening to GA.

### 32.1 Auth & access

- [ ] Sign-up via magic link or Google OAuth
- [ ] Magic link rate-limited and abuse-tested (CAPTCHA on risk)
- [ ] Email change flow (verify new + revert link on old)
- [ ] Account self-deletion
- [ ] Tenant ownership transfer + last-owner safeguard
- [ ] Onboarding-after-invite path differs from self-signup
- [ ] Session list, revocation, logout-everywhere
- [ ] Trusted-device cookie + new-device alert
- [ ] Re-auth modal at 23h idle preserves form state
- [ ] CSRF (double-submit) on all mutating routes
- [ ] Impossible-travel detection alerts

### 32.2 Multi-tenancy

- [ ] Drizzle tenant-scope middleware blocks cross-tenant access (negative test)
- [ ] Plan seat limits enforced on invite + downgrade
- [ ] Tenant DEK encrypts AI keys, webhook secrets; rotation tested
- [ ] Customer-portal wildcard (`*.portal.ilinga.com`) and custom-domain on-demand TLS
- [ ] Region routing per tenant (`eu|us|za`)

### 32.3 Ventures, interview, synthesis

- [ ] Create venture with brief, geos, industry (AI-detected fallback)
- [ ] Upload artifacts (PDF, deck, doc, image), text extraction kicks off
- [ ] Add competitor URLs, scrape kicks off
- [ ] Interview: progress map, hints, agent panel, follow-ups, save draft, skip
- [ ] Synthesis pipeline runs end-to-end, content keys resolve, conflicts resolved by reducer
- [ ] Re-synthesis charges credits and supersedes prior key versions
- [ ] Stakeholder feedback loop: invite, respond via magic link, fold into keys

### 32.4 Reports

- [ ] Free reports render at 0 cr; pro/premium charge correct amount
- [ ] Re-render same template/version free
- [ ] Force re-render charges full price
- [ ] PDF, HTML, DOCX, PPTX, MD outputs correct
- [ ] Watermark renders on share links
- [ ] Tagged PDF passes Acrobat accessibility checker
- [ ] Share links: time-limited, optional password, audit logged

### 32.5 Templates

- [ ] System Handlebars templates ship for each report type
- [ ] Tenant uploads custom template; sandbox blocks malicious helpers
- [ ] Preview against sample cycle works
- [ ] Template versioning preserves prior renders

### 32.6 Credits & billing

- [ ] Subscription checkout (Free, Studio, Pro, Firm) via Dodo
- [ ] Top-up packs purchase via Dodo
- [ ] Webhook handlers idempotent (duplicate `event.id` does not double-credit)
- [ ] Monthly allowance auto-credited on `subscription.renewed`
- [ ] Trial start/eligibility/end transitions
- [ ] Coupons validate + apply at checkout
- [ ] Tax (VAT/GST/sales) applied via Dodo, shown on invoices
- [ ] Dunning sequence runs on `payment.failed`; read-only mode at T+14d
- [ ] BYO endpoint billing charges only orchestration credits
- [ ] Plan upgrade prorates; downgrade defers; cancellation effective at period end
- [ ] Credit ledger balances reconcile end-of-day

### 32.7 Usage reporting

- [ ] Burn-rate chart, top prompts/modules/reports/users
- [ ] Per-cycle and per-report cost breakdowns
- [ ] CSV export
- [ ] Forecasts + low-balance and over-projection notifications
- [ ] BYO vs system endpoint split visible

### 32.8 AI endpoints + models

- [ ] BYO endpoints (OpenAI, Azure, Anthropic, Bedrock, Vertex, Ollama, OpenAI-compat) tested
- [ ] Test connection works, validates model id
- [ ] Routing per workload + fallback to system on error
- [ ] Model registry surfaces system catalog + tenant additions
- [ ] Embeddings model routable; pgvector store populated

### 32.9 n8n & agent designer

- [ ] Internal-only n8n on 127.0.0.1, never exposed via Caddy
- [ ] HMAC on inbound + outbound calls
- [ ] All canonical workflows imported and active
- [ ] Job queue + watchdog reconciles stuck executions
- [ ] In-app agent designer: create/version/dry-run/promote/rollback
- [ ] Workflow security guardrails reject disallowed nodes

### 32.10 Notifications, email, SMS

- [ ] Resend primary, Postmark failover; bounces/complaints honoured
- [ ] SPF/DKIM/DMARC + BIMI wired
- [ ] Twilio + MessageBird failover; STOP/HELP handled
- [ ] Notification preferences respected; digest works; critical override works
- [ ] Inbox + SSE stream + mark-read flows in app

### 32.11 Compliance

- [ ] Audit log captures every mutation, sensitive fields redacted
- [ ] Data export job produces complete tarball within 24h SLA
- [ ] Data deletion (user/cycle/tenant) tested with dry-run
- [ ] Artifact retention purge runs; audit log retained 7y
- [ ] SOC 2 evidence collector exports monthly
- [ ] Sub-processor list maintained at `/legal/subprocessors`

### 32.12 Deployment & ops

- [ ] Caddy auto-TLS, on-demand for portals, security headers in place
- [ ] PM2 cluster mode, graceful reload, health checks
- [ ] Deploy script validates migrations dry-run before apply
- [ ] GeoDNS routes to nearest healthy region
- [ ] Backups: daily full, hourly incremental; restore drill passes
- [ ] Status page reflects real component health

### 32.13 Observability

- [ ] Pino structured logs shipped; PII redacted
- [ ] Prometheus metrics + Grafana dashboards live
- [ ] OpenTelemetry traces propagate end-to-end
- [ ] Sentry capturing front + back errors; source maps uploaded
- [ ] Synthetic uptime probes from 3 regions
- [ ] SLO dashboards + alert thresholds live

### 32.14 UX & frontend

- [ ] Light + dark themes, follow-system, no FOUC
- [ ] Pixel-close to prototype on every screen (Dashboard, Venture, Interview, Synthesis, Outputs, Reports, Credits, Settings)
- [ ] Command palette (`⌘K`) with search + nav + actions
- [ ] Legal routes (`/legal/terms`, `/privacy`, `/eula`, `/cookies`, `/dpa`, `/subprocessors`)
- [ ] Cookie banner respects DNT + per-region defaults
- [ ] WCAG 2.2 AA in axe-core CI; keyboard-only smoke pass
- [ ] i18n: en + at least one alt locale shipped; RTL-safe layouts

### 32.15 Security

- [ ] hCaptcha on auth surfaces; risk-based escalation
- [ ] All secrets encrypted at rest with rotated DEKs/KEK
- [ ] CSP strict, HSTS preload, COOP/COEP on app
- [ ] SSRF protection on outbound webhooks
- [ ] Dependency + container scans clean; SBOM published
- [ ] External pentest passed; bounty programme listed
- [ ] `/.well-known/security.txt` published

### 32.16 Developer platform

- [ ] OpenAPI + Swagger UI live
- [ ] TS + Python SDKs published
- [ ] PATs + service accounts with scoped permissions
- [ ] Per-token rate limits + standard headers

---

## Appendix C — Out-of-scope at GA (deferred backlog)

- AI co-pilot inside the editor (in-line assist while answering questions).
- Native mobile apps (PWA only at GA).
- Marketplace for third-party prompt packs.
- White-labelled enterprise tenancy with full brand themes (Phase 11+).
- BI integrations (Snowflake / BigQuery export of usage events).
- Customer support tooling (HelpScout / Front integration); start with shared inbox + Linear.

---

## §33 Live processing feedback (streaming)

Users must see things move in real time while a cycle is being processed —
synthesis pipeline progress, per-module status, model output tokens as they
arrive, competitor scrape progress, artifact extraction progress, reducer
verdicts, and report render progress.

### 33.1 Transport

Server-Sent Events (SSE). One-way server → client; works through Caddy
without WebSocket upgrades; native `EventSource` browser API. Auto-reconnect
with `Last-Event-ID` to resume from last seen event id. Per-stream in-memory
ring buffer (last 200 events per cycle) so reconnects don't lose events.

### 33.2 Streams

| Path                                              | Events                                                  |
| ------------------------------------------------- | ------------------------------------------------------- |
| `GET /cycles/:cid/events`                          | `stage.started`, `stage.complete`, `cluster.complete`, `cycle.error` |
| `GET /cycles/:cid/modules/:mid/events`             | `module.queued|running|complete|failed`, `prompt.token`, `prompt.complete` |
| `GET /cycles/:cid/reports/:rid/events`             | `render.queued`, `render.html_ready`, `render.pdf_progress` (page n/N), `render.complete`, `render.failed`, `render.cancelled` |
| `GET /cycles/:cid/artifacts/:aid/events`           | `artifact.scan.*`, `artifact.extract.progress`, `artifact.extract.complete` |
| `GET /cycles/:cid/competitors/:coid/events`        | `competitor.scrape.*`                                    |
| `GET /cycles/:cid/presence`                        | `presence.joined`, `presence.left`, `presence.location` |
| `GET /notifications/stream` (existing §18)         | cross-cycle, user-scoped notifications                    |

Event format:
```
id: <ulid>
event: prompt.token
data: {"moduleId":"...","runId":"...","delta":"the leading…"}
```

### 33.3 Backend

- `apps/api/src/lib/sse/{hub,server}.ts` — in-process pub/sub keyed by `(tenantId, cycleId, [moduleId|reportId|...])`.
- PM2 cluster has 2 API workers, so events from worker A must reach SSE clients on worker B → **Valkey pub/sub** as the backplane (`il-sse:<key>` channel).
- `lib/sse/server.ts` writes the SSE response, registers the connection on the hub, replays buffered events from `Last-Event-ID`, tears down on client disconnect.
- Auth: same session cookie + tenant header; 5-min idle keepalive (`event: keepalive`).
- Backpressure: per-connection buffer 1MB; drop with `event: stream.dropped` if exceeded so the client knows to refetch a snapshot.

### 33.4 Producers

- **AI provider streaming**: every provider in `lib/ai/providers/*.ts` exposes `stream(req)` returning an async iterator of token deltas. The prompt runner publishes `prompt.token` events as deltas arrive, then `prompt.complete`.
- **n8n callbacks**: workflow nodes post progress via the existing callback endpoints; the API translates each into a hub publish. The agent designer (§21) lets admins add explicit "Emit progress" nodes that POST to `/n8n/callbacks/progress`.
- **Render worker**: emits per-stage events while Playwright runs; for PDF, reports `page n of N` from the headless browser's page-rendered hooks.
- **Artifact + competitor workers**: pct-progress and stage events.

### 33.5 Cancellation

| Method | Path                                              | Effect                          |
| ------ | ------------------------------------------------- | ------------------------------- |
| POST   | `/cycles/:cid/synthesis/cancel`                    | sets pipeline + in-flight prompt runs to `cancelled`; AbortController kills provider streams; refunds unused credits; emits `stream.cancelled` |
| POST   | `/cycles/:cid/synthesis/modules/:mid/cancel`       | scope to one module             |
| POST   | `/cycles/:cid/reports/:rid/cancel`                 | best-effort kill of Playwright context; refund credits if no PDF emitted yet |

### 33.6 Frontend

- `apps/web/src/lib/streaming/useEventStream.ts` — typed React hook wrapping `EventSource`, auto-reconnect, exponential backoff (250ms → 4s).
- `features/synthesis/agent-stream.tsx` — live timestamped log panel (matches prototype).
- `features/synthesis/pipeline-graph.tsx` — stage cards transition `queued → running → done`; running stages animate.
- `features/synthesis/module-output.tsx` — typewriter token stream into narrative pane; switches to "saved" when `prompt.complete` arrives.
- `features/reports/render-progress.tsx` — progress bar from `render.pdf_progress`; download buttons enable on `render.complete`.
- `aria-live="polite"` region announces stage transitions for screen readers.
- Pause-on-`prefers-reduced-motion`: typewriter effect collapses to single insertion.

### 33.7 Reconnection + fallback

If SSE fails 3× in a row, hook falls back to polling (`GET .../status` every 2s) and surfaces a "live updates paused" indicator. Once a successful event arrives the indicator clears.

### 33.8 Tests

- `sse/hub.test.ts` (publish → all subscribers in order; ring buffer truncation; backpressure drop emits sentinel)
- `useEventStream.test.ts` (reconnect path with `Last-Event-ID` header; type-narrowing on event types)
- Integration: 3 mocked streaming prompts → all token deltas reach connected supertest client via SSE in correct order
- Cancel mid-stream verifies refund + `stream.cancelled` emitted
- Reconnect resumes from last event id without dupes
- E2E (Playwright): start synthesis, watch agent-stream populate live; kill API worker mid-run, observe reconnect resumes
- Load: 200 concurrent SSE clients on one cycle; p95 event-to-frontend latency <500ms

---

## §34 UX gap closure (functionality + polish)

These are mandatory for GA. Each item lists its owning build phase (see §37).

### 34.1 Functionality-blocking

| # | Item | Phase |
| - | ---- | ----- |
| 1 | Stakeholder-side flow at `/s/:token` (no auth, scoped to invited questions/reports; submit; reminder cadence; opt-out; stakeholder may upload an artifact + leave free-text feedback) | 6, 11 |
| 2 | Cycle close + cancel running synthesis / render (confirmation modal listing frozen artifacts; cancel aborts in-flight provider streams + refunds) | 7, 8 |
| 3 | Failed-action UX: per-failed `prompt_run` / `report_render` / scrape banner with reason + Retry + Contact support | 7, 8 |
| 4 | Concurrency: optimistic-lock answers via `If-Match: <answer.version>`; 412 on conflict with merge UI; live presence dots + "last edited by" via SSE | 6, 8 |
| 5 | Soft-delete + trash + 30-day restore for ventures and cycles | 5, 12 |
| 6 | File preview + ClamAV virus scan (`workers/artifact-scan.ts`) before extraction; quarantine on hit | 5 |
| 7 | Email change flow (verify new email via magic link; old gets 15-min revert link) | 3 |
| 8 | Account self-deletion separate from tenant deletion | 12 |
| 9 | Tenant ownership transfer with confirmation + new-owner accept | 5 |
| 10 | Last-owner safeguard (cannot remove the only owner) | 5 |
| 11 | Onboarding-after-invite path (skip "create workspace" step) | 5 |
| 12 | Tenant deletion grace + restore window (7d soft-delete before hard-delete) | 12 |
| 13 | Auto top-up: threshold + pack + monthly cap; charges via Dodo when `credits.balance_low` | 9 |
| 14 | Invoice PDF download with company name + VAT ID; receipts auto-emailed on payment | 9 |
| 15 | Plan limits visualisation component (seats used, credits used) | 9 |
| 16 | Upgrade/downgrade preview ("$99.32 today, $149/month thereafter") | 16 |
| 17 | Coupon redemption confirmation surface | 16 |
| 18 | Tenant impersonation by platform admin (persistent banner + double-actor audit logging) | 11 |
| 19 | In-app bug report widget (screenshot + console + last 10 requests + request_id) | 4 |
| 20 | Contact / support form at `/help/contact` | 4 |
| 21 | Designed error pages: 404, 403, 500, 429, 503, offline, read-only | 4 |
| 22 | Maintenance banner with scheduled-window awareness | 4 |
| 23 | Inline edit of generated narrative (writes new `content_keys` version `source='manual'`) | 8 |
| 24 | Pin / star content keys | 7 |
| 25 | Cycle clone (new cycle on same venture, carry brief + competitors + artifacts, reset answers + outputs) | 5 |
| 26 | Compare two cycles' reports side-by-side (diff narratives + key changes) | 8 |
| 27 | Re-synth of closed cycle blocked → opens new cycle (explicit UX) | 7 |
| 28 | Schedule future re-render (cron-like, weekly board snapshot) | 8 |
| 29 | Audit-log tamper-evidence: hash chain (`prev_hash` SHA-256 of previous row) | 12 |
| 30 | DSAR workflow UX (user request page + admin queue) | 12 |
| 31 | Right-to-rectification flow | 12 |
| 32 | Cookie consent versioning (record consent against policy version hash) | 4 |
| 33 | Customer-portal mode dedicated nav (no Settings → Billing; only Venture, Interview, Reports) | 11 |
| 34 | Custom domain onboarding: prove DNS, issue cert via on-demand TLS, branded landing | 11 |
| 35 | Brand picker (logo + accent colour) propagating into emails | 11 |
| 36 | Webhook secret rotation 24h grace (previous secret valid; broadcast both via `X-Webhook-Signature-Old`) | 11 |
| 37 | Webhook delivery replay button (data exists in §3.12; explicit UI button) | 11 |
| 38 | Per-tenant API request log (debugging surface, retained 7d) | 28-equivalent (now 24) |
| 39 | Resume mid-onboarding (close wizard → next sign-in lands on next step) | 5 |

### 34.2 UX polish (no "v2 later")

| # | Item | Phase |
| - | ---- | ----- |
| 40 | Empty states for every list (Ventures, Cycles, Reports, Outputs, Audit, Notifications, Credits ledger, Templates, Webhooks, AI endpoints, API tokens, Stakeholders, Trash) — illustrated, single primary CTA | 4 + each owning phase |
| 41 | Skeleton loaders for every async list/detail; suspense fallbacks; route-level loading bar | 4 |
| 42 | Global error boundary, toast system (`components/toast.tsx`), zod error → field-level mapping | 4 |
| 43 | Session expiry UX: 23h idle warning modal, re-auth without losing form state (`useFormPersist`) | 3, 4 |
| 44 | Responsive layouts: tablet read-only minimum on Dashboard, Reports, Credits, Settings; sidebar drawer ≤768px | 4 |
| 45 | In-app help: `/help` MDX docs, `?` shortcut for contextual help drawer, glossary chips on cluster/module/wedge/key/credit | 4, 22 |
| 46 | Marketing landing + pricing page + compare-plans table + checkout-handoff | 4, 9 |
| 47 | Comments + @-mentions on questions and rendered reports (`comments`, `comment_mentions` tables) | 6, 8 |
| 48 | Keyboard shortcut cheatsheet (`?`); `g d / g v / g i / g r / g c / g s` navigation; `j/k` list nav | 22 |
| 49 | Time-zone-aware rendering (user TZ on `users.timezone`, `date-fns-tz`) | 4 |
| 50 | Print styles for app pages (clean printing of Outputs in particular) | 4 |
| 51 | Privacy-aware product analytics: PostHog self-hosted EU, gated by cookie consent | 4 |
| 52 | Trial countdown banner + upgrade nudge (`subscription.status='trialing'`) | 16 |
| 53 | Read-only mode banner + every write button disabled with tooltip when `subscription.status ∈ {unpaid, paused}` | 16 |
| 54 | Last login + recent activity widget on Dashboard | 4 |
| 55 | Quick-start cards on Dashboard (create venture, invite teammates, add AI endpoint, top up credits — vanish when each is done) | 5 |
| 56 | Demo / sample-data mode: new tenants get a seeded "Northwind Cargo" cycle behind a `Demo` flag; one-click reset; cannot bill credits | 5 |
| 57 | Activity feed per cycle (`/cycles/:cid/activity`) reading from `audit_log` filtered + humanised | 6, 8 |
| 58 | SEO basics: `<meta description>`, Open Graph, Twitter cards, `robots.txt`, `sitemap.xml`, canonical URLs | 4 |
| 59 | Trust strip on marketing (logos, security badges, SOC 2-in-progress notice) | 4 |
| 60 | Webhook "Send test event" button | 11 |
| 61 | Spellcheck on prose answer fields, off on URL/code | 6 |

---

## §35 Frontend conventions (no-dead-UI rule + patterns)

### 35.1 No dead buttons or links — hard rule

No rendered button, link, menu item, tab, toggle, icon-button, or interactive
control in any merged PR may be a no-op, a `href="#"`, an `onClick` that only
logs, a "coming soon" stub, or a route that 404s. Every interactive element
must either:

1. Perform its action against the live API, **or**
2. Open a real route that renders real content, **or**
3. Be **conditionally hidden** behind a feature flag (`apps/web/src/lib/flags.ts`) when the backend isn't ready — never disabled-and-visible without a tooltip stating why.

#### Enforcement

- `apps/web/e2e/no-dead-ui.spec.ts` — Playwright crawl that:
  1. Logs in as a seeded owner.
  2. Visits every route reachable from the sidebar, topbar, and command palette.
  3. For each route, queries every visible-and-enabled `<a>`, `<button>`, `[role="button"|"tab"|"menuitem"]`, `<select>` option.
  4. Asserts:
     - Anchors: `href` non-empty, not `#`, not `javascript:`; clicking resolves to a 200 route without `data-testid="not-found"`.
     - Buttons: clicking either issues an XHR (visible to MSW spy) **or** changes URL **or** mutates a visible DOM region. None of these → fail.
     - Tabs/menus: each panel non-empty.
- ESLint rule `no-empty-handlers` (custom under `packages/eslint-config/`) fails on `onClick={() => {}}`, `onClick={noop}`, `href="#"`, `href="javascript:..."`.
- Storybook (or Ladle) snapshot of each interactive component must declare its action prop; a default "noop" prop is rejected by lint.

### 35.2 Standard patterns

- **Empty states** (§34 #40): one `<EmptyState>` component (`components/empty-state.tsx`) with `icon`, `title`, `body`, `cta`. Every list uses it; copy is feature-specific.
- **Skeleton loaders** (§34 #41): one `<Skeleton>` primitive + per-route `*-skeleton.tsx` matching final layout. Suspense fallbacks for route-level lazy-loaded chunks. Top-of-page progress bar (`nprogress`-style) on route transitions.
- **Toast + error boundary** (§34 #42): `<Toaster>` provider; `useToast()` hook with `info|success|warning|error`. Errors from the API client surface a default toast unless the caller passes a field-mapper. Top-level `<ErrorBoundary>` for route trees with a "Send report" button (wired to §34 #19).
- **Form persistence** (§34 #43): `useFormPersist(key, control)` autosaves to `sessionStorage` with debounce; restored on remount; cleared on submit success.
- **Loading-aware buttons**: `<Button loading>` shows spinner + disables; never two clicks producing two requests.
- **Confirmation modals** for destructive actions; require typing the resource name for permanent deletes.
- **Action providers**: a single `actions/` registry maps action ids → handlers; sidebar/topbar/palette/keyboard all dispatch via the same registry to prevent stale buttons.
- **Live regions**: SSE-driven panes have `aria-live="polite"`; reduced-motion swaps token typewriter for single-paint.
- **Time formatting**: `formatDateTZ(date, user.timezone)` everywhere; never raw `toLocaleString()`.
- **Currency**: `formatMoney(cents, currency)` everywhere; never raw `/100`.
- **Numbers**: `formatNumber(n, { compact })` — credits, tokens, pages.

### 35.3 Acceptance per phase

For every frontend phase:
- `pnpm e2e -- no-dead-ui` is green for that phase's routes.
- Coverage for the route's container component reaches ≥80% lines, with every button's handler exercised at least once.
- Empty states + skeletons exist for every async list shipped that phase.

---

## §36 Schema additions (consolidated)

These tables and columns extend §2 to support §33–§35 and §34's UX items.

```sql
-- Comments + mentions on questions, modules, reports
comments
  id UUID PK,
  tenant_id UUID FK,
  cycle_id UUID,
  target_table STRING,                  -- 'question_answers'|'modules'|'report_renders'
  target_id UUID,
  author_id UUID FK → users.id,
  body STRING,                           -- markdown, max 8kb
  created_at, updated_at, deleted_at
  index (tenant_id, target_table, target_id, created_at)

comment_mentions
  comment_id UUID PK part,
  mentioned_user_id UUID PK part,
  notified_at TIMESTAMPTZ

-- Live presence for collaborative awareness
cycle_presence
  tenant_id UUID PK part,
  cycle_id UUID PK part,
  user_id UUID PK part,
  last_seen_at TIMESTAMPTZ NOT NULL,
  location STRING                        -- 'interview/Q3.4'|'synthesis'|'reports/snapshot'

-- Antivirus scan results for uploaded artifacts
artifact_scans
  artifact_id UUID PK,
  status STRING NOT NULL,                -- 'queued'|'clean'|'infected'|'failed'
  scanned_at TIMESTAMPTZ,
  signature_db_version STRING,
  threat_name STRING

-- User preferences consolidated
ALTER TABLE users
  ADD COLUMN timezone STRING NOT NULL DEFAULT 'UTC',
  ADD COLUMN ui_preferences JSONB NOT NULL DEFAULT '{}';
  -- ui_preferences shape: { theme:'light|dark|system', email_tracking:bool,
  --                         reduced_motion:bool, density:'comfortable|compact' }

-- Audit log tamper evidence (hash chain)
ALTER TABLE audit_log
  ADD COLUMN prev_hash BYTES,            -- sha-256 of previous row's serialized fields
  ADD COLUMN row_hash BYTES NOT NULL;    -- this row's hash

-- Auto top-up configuration
auto_topups
  tenant_id UUID PK,
  enabled BOOL NOT NULL DEFAULT false,
  threshold_credits INT NOT NULL,        -- e.g. 50
  pack_code STRING NOT NULL,             -- references credit_packs.code
  monthly_cap_cents INT,                 -- safety
  spent_this_period_cents INT DEFAULT 0,
  period_resets_at TIMESTAMPTZ,
  updated_at

-- Optimistic locking on answers
ALTER TABLE question_answers
  ADD COLUMN version INT NOT NULL DEFAULT 1;

-- Stakeholder uploads + free-text feedback
ALTER TABLE stakeholder_responses
  ADD COLUMN free_text STRING,
  ADD COLUMN uploaded_artifact_id UUID FK → venture_artifacts.id;

-- Pinned content keys
content_key_pins
  tenant_id UUID PK part, cycle_id UUID PK part, code STRING PK part,
  pinned_by UUID, pinned_at TIMESTAMPTZ

-- Trash / soft delete tombstones with restore deadline
deletion_tombstones
  id UUID PK,
  tenant_id UUID,
  target_table STRING,
  target_id UUID,
  deleted_by UUID,
  deleted_at TIMESTAMPTZ,
  restore_deadline TIMESTAMPTZ,           -- e.g. now + 30d for ventures, 7d for tenants
  hard_deleted_at TIMESTAMPTZ,
  index (tenant_id, target_table, restore_deadline)

-- Impersonation sessions (platform admin → tenant user)
impersonation_sessions
  id UUID PK,
  admin_user_id UUID FK → users.id,
  impersonated_user_id UUID FK → users.id,
  tenant_id UUID,
  reason STRING,
  started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
  ip INET, user_agent STRING

-- Cookie consent versioned record
cookie_consents
  id UUID PK,
  user_id UUID NULL,                     -- null for anon visitors keyed by anon_id
  anon_id STRING NULL,
  policy_version_hash STRING NOT NULL,
  categories JSONB,                       -- {essential:true, analytics:false, ...}
  ip INET, user_agent STRING, created_at

-- Per-tenant API request log (debugging)
api_request_log
  id UUID PK,
  tenant_id UUID, actor_user_id UUID NULL, api_token_id UUID NULL,
  method STRING, path STRING, status INT, latency_ms INT,
  request_id STRING, ip INET,
  created_at
  index (tenant_id, created_at DESC)
  -- retain 7 days, partition by day for cheap drops

-- DSAR + rectification queue
dsar_requests
  id UUID PK, user_id UUID, tenant_id UUID,
  kind STRING,                            -- 'access'|'rectification'|'erasure'|'portability'|'restriction'
  description STRING, status STRING,
  assigned_admin_id UUID, resolution STRING,
  created_at, resolved_at

-- Maintenance windows
maintenance_windows
  id UUID PK, starts_at, ends_at, message STRING, severity STRING,
  affects_components JSONB, published BOOL, created_by, created_at
```

### Schema modifications already in §2 retained

`venture_cycles.deleted_at`, `ventures.deleted_at` already supported soft-delete; UI exposes them under §34 #5.

### Removed tables (no longer required after auth simplification)

`user_mfa`, `user_email_otps`, `user_phone_otps` — drop in a future migration.
For Phase 2 of the build, simply do not seed/use them.

### Removed tables (no longer required after dropping SSO/SCIM)

`tenant_idp`, `tenant_idp_domains` — never created.

---

## §37 Build phases (executable plan)

Sequential phases on branch `claude/ilinga-saas-platform-ffsjc`, Conventional
Commits, push at the end of each phase. **Definition of done per phase**:
lint + types + unit + integration + Playwright E2E + `no-dead-ui` crawl +
axe-core a11y scan + Lighthouse perf budget all green; coverage ≥80% on lines
touched; every shipped route has its empty/loading/error states + skeletons +
toasts; SSE pathways have an `aria-live` region.

### Phase 0 — Repo bootstrap

- pnpm + turbo monorepo: `apps/{web,api,workers}`, `packages/{db,ui,sdk,eslint-config,tsconfig,emails}`.
- Node 22 LTS, TypeScript strict.
- ESLint flat config + Prettier; custom rule `packages/eslint-config/no-empty-handlers.ts` (forbid `onClick={() => {}}`, `href="#"`, `href="javascript:..."`).
- Vitest, Playwright, MSW, axe-playwright, lighthouse-ci.
- Husky + lint-staged.
- GitHub Actions matrix: lint, typecheck, unit, integration, e2e, e2e-no-dead-ui, a11y, lighthouse.
- `.env.example` for api/web/workers; `docker-compose.yml` for local Cockroach + Valkey + n8n.
- README for `pnpm dev`.

### Phase 1 — Database + KMS

- Drizzle schema for §2 + §36 (every table including comments, presence, scans, hash-chained audit log, auto top-ups, deletion tombstones, impersonation, cookie consents, api request log, dsar, maintenance windows, content key pins).
- `CREATE EXTENSION IF NOT EXISTS vector;` first migration.
- `lib/kms/{kek,dek}.ts` — KEK from `IL_KMS_KEK_HEX`, AES-256-GCM wrap/unwrap, rotation tested.
- `pnpm db:seed` — plans (incl. `enterprise`), credit packs, system AI registry, demo "Northwind Cargo" tenant + cycle, four report templates.
- Drizzle tenant-scope guard middleware.
- Tests: cross-tenant access denied; KMS round-trip; demo data renders.

### Phase 2 — API skeleton + observability

- Hono on Node 22 (Fastify also acceptable; Hono chosen for type-safety and small footprint), routes scaffolded as 501s and feature-flagged off.
- Zod request/response schemas, request id middleware, structured pino logging, OpenTelemetry traces to local OTel collector → Grafana Tempo.
- Error envelope per §3.3, problem-details JSON.
- Rate limiting via Valkey token bucket.
- `/v1/internal/healthz`, `/v1/internal/readyz`, `/v1/internal/version`.
- BullMQ queues + workers app skeleton.
- SSE hub (`lib/sse/{hub,server}.ts`) with Valkey pub/sub backplane (§33.3).
- Tests: rate limit, request-id propagation, SSE multi-worker fanout.

### Phase 3 — Auth (magic link + Google) + email

- §4 magic-link flow (purposes: signup, signin, tenant_invite, email_change_verify, account_recovery, step_up).
- Google OAuth Auth Code + PKCE.
- Email change flow + revert link.
- Account self-deletion endpoint.
- Sessions, `il_session` + `il_csrf` cookies, idle/absolute timeouts, sliding refresh, `il_device` cookie + new-device alert.
- Re-auth modal at 23h with `useFormPersist`.
- Cookie consent versioning (`cookie_consents`).
- Resend primary + Postmark failover (§16); transactional template MJML for: magic_link, invite, email_change_verify, new_device_alert, payment_receipt, low_credits.
- Tests: enumeration-safe; no double-consume; PKCE state mismatch rejected; email failover under primary 5xx; cookie consent recorded; impossible-travel alert.

### Phase 4 — Web app shell + design system

- Vite + React + TypeScript + React Router; Tailwind v4 with `@theme` tokens (§15) for light + dark; system-respecting toggle.
- `packages/ui` primitives: Button (with `loading` state), Input, Select, Textarea, Modal, Tabs, Toast, EmptyState, Skeleton, Badge, Avatar, Card, Dropdown, Command Palette, ProgressBar, ToggleGroup, Tooltip, Sheet (sidebar drawer).
- Layouts: marketing, app, customer-portal, stakeholder, admin.
- App shell: topbar, sidebar (with action-registry-driven nav), command palette (`g d / g v / …` shortcuts + `?` cheatsheet), keyboard nav.
- Global error boundary with "Send report" wired to bug-report widget.
- Designed error pages: 404, 403, 500, 429, 503, offline, read-only.
- Maintenance banner reads `/v1/internal/maintenance`.
- Toaster + form-persist + skeletons + route-level loading bar.
- `/help/*` MDX docs + `/help/contact`; glossary chips.
- `/legal/*` MDX (terms, privacy, DPA, security.txt, cookies); cookie banner.
- SEO: meta description, OG, Twitter, robots, sitemap, canonical.
- Marketing landing + pricing + compare-plans + trust strip + checkout-handoff.
- Bug-report widget (screenshot via `html2canvas`, console buffer, last 10 XHRs, request_id).
- TZ-aware formatters; print styles; PostHog (self-hosted EU) gated by consent; last-login + recent-activity widget; quick-start cards.
- Tests: `e2e/no-dead-ui.spec.ts` for every shell route; axe a11y; LH ≥90 on app shell.

### Phase 5 — Tenants, members, roles, ownership

- §5 endpoints; invite via magic-link `purpose=tenant_invite`; resume-mid-onboarding.
- Onboarding-after-invite differs from self-signup (skip "create workspace").
- Tenant ownership transfer + accept; last-owner safeguard.
- Soft-delete venture (`deletion_tombstones`, 30d), trash + restore page.
- Cycle clone.
- Demo / sample-data tenant flag (Northwind Cargo seeded; one-click reset; cannot bill credits).
- Quick-start cards on Dashboard (Create venture, Invite teammates, Add AI endpoint, Top up).
- File preview + ClamAV virus scan worker (`workers/artifact-scan.ts`); quarantine on hit.
- Tests: invite accept atomic, last-owner cannot leave, restore window, demo cannot bill, scan blocks extraction on hit.

### Phase 6 — Ventures, brief, artifacts, competitors, interview

- Brief schema (§6); industry/geos auto-detect (system AI).
- Artifact upload (R2 presigned PUT) → scan (Phase 5) → extraction worker (PDF, deck, doc, image OCR) → embeddings.
- Competitor URL add → scrape worker (`workers/competitor-scrape.ts`) → text + structured fields.
- Interview UI (matches prototype): progress map (`g d`-like nav), `agent-stream` pane, hints, follow-ups, save draft, skip.
- Optimistic locking on answers (`If-Match: <version>` → 412 with merge UI).
- Live presence dots + "last edited by" via SSE (`/cycles/:cid/presence`).
- Comments + @-mentions on questions (`comments`, `comment_mentions`).
- Spellcheck on prose; off on URL/code.
- Stakeholder portal `/s/:token` (no auth, scoped, opt-out, reminder cadence, free-text feedback, optional artifact upload).
- Activity feed `/cycles/:cid/activity` reading from audit log.
- Tests: 412 on stale `If-Match`; presence broadcast across two browsers; stakeholder-token scoped to invited Qs; mention notification; spellcheck attribute.

### Phase 7 — Synthesis pipeline + cancellation

- §6 content keys, modules, prompt runs, reducer, conflict resolution.
- AI provider streaming (`stream(req)` async iterator) for OpenAI / Anthropic / Mistral / Cohere / Groq / generic OpenAI-compat / Ollama.
- SSE: `prompt.token`, `prompt.complete`, `module.*`, `cluster.complete`, `stage.*`, `cycle.error`.
- Cancellation: `POST /cycles/:cid/synthesis/cancel`, per-module cancel; AbortController kills provider streams; refunds unused credits; emits `stream.cancelled`.
- Failed-action banner per failed `prompt_run` (reason + retry + contact support).
- Re-synth opens new cycle if the source cycle is closed (explicit UX).
- Pin / star content keys.
- Tests: 200 concurrent SSE clients; mid-stream cancel refunds; provider 429 retries with backoff; reducer conflict deterministic.

### Phase 8 — Reports + render worker + cancellation

- Handlebars templates (4 default: Investor Pulse, GTM Snapshot, Risk Map, Board Brief), MJML for PDF.
- Render worker via Playwright (`workers/render.ts`) emitting `render.queued`, `render.html_ready`, `render.pdf_progress` (page n/N), `render.complete`, `render.failed`, `render.cancelled`.
- Inline narrative edit writes new `content_keys` version `source='manual'`.
- Compare two cycles' reports side-by-side.
- Schedule future re-render (cron-like).
- Cycle close + cancel running synthesis + render in single confirm (lists frozen artifacts).
- Comments + mentions on rendered reports.
- Failed-action banner per failed `report_render`.
- Tests: cancel mid-PDF refunds; close-cycle freezes `cycle.frozen_at`; comparison diff stable; scheduled re-render fires within 60s window.

### Phase 9 — Dodo Payments + credits + auto top-up + invoices

- §8 + §19 + §36 `auto_topups`.
- Plans seed including `enterprise`; checkout for plan + topup; webhook idempotency on `dodo_event_id`.
- Auto top-up: threshold + pack + monthly cap; charges via Dodo when `credits.balance_low`.
- Upgrade/downgrade preview with proration ("$99.32 today, $149/month thereafter").
- Coupon redemption confirmation surface.
- Invoice PDF download with company name + VAT ID; receipts auto-emailed on payment via Phase 3 templates.
- Plan-limits visualisation (seats used, credits used).
- Trial banner; read-only mode banner when `subscription.status ∈ {unpaid, paused}` (every write disabled with tooltip).
- Tests: webhook replay (no double-credit); auto-topup respects monthly cap; invoice PDF byte-deterministic for same data; read-only blocks all `POST /v1/*` write paths.

### Phase 10 — n8n integration + agent designer

- §7 inbound (`/n8n/exec`) + callbacks (`/n8n/callbacks/*` including `progress`).
- HMAC + replay-protection (`X-Il-Timestamp` + nonce); shared secrets in env.
- §21 in-app agent designer: read/write workflow JSON via n8n REST, validation, sandboxed test run, credentials shim mapping tenant AI endpoints.
- "Emit progress" node POSTs to `/n8n/callbacks/progress` → SSE.
- Tests: HMAC tampering rejected; nonce replay rejected; sandboxed run blocked from external HTTP.

### Phase 11 — Customer-portal + custom domain + brand + webhooks + impersonation

- `*.portal.ilinga.com` SPA mode (nav: Venture, Interview, Reports — no Settings → Billing).
- Custom domain onboarding: prove DNS, on-demand TLS, branded landing.
- Brand picker (logo + accent) propagating into transactional emails.
- Webhook delivery (§3.12) + secret rotation 24h grace (`X-Webhook-Signature-Old`); replay button; "Send test event" button.
- Per-tenant API request log (7d retention, partition-by-day).
- Stakeholder reminder cadence cron.
- Platform-admin tenant impersonation: persistent banner + double-actor audit logging via `impersonation_sessions`.
- Tests: portal cannot reach tenant settings even if URL guessed; on-demand TLS issuance flow; webhook old-secret accepted within 24h then rejected; impersonation rows present + banner shown.

### Phase 12 — Compliance: audit hash chain + DSAR + tenant deletion grace + retention

- Audit-log hash chain (`prev_hash`, `row_hash`); tamper detection job (`workers/audit-verify.ts`).
- DSAR queue UX: user request page + admin queue (`dsar_requests`).
- Right-to-rectification flow.
- Tenant deletion: 7d soft-delete + restore window; hard-delete worker (`workers/retention.ts`).
- Account self-deletion (separate from tenant) with grace period.
- Data retention defaults per §12 + per-tenant overrides.
- Tests: chain verifies on a clean DB; tampering one row fails verification; restore within 7d revives; hard-delete after 7d removes R2 + DB + backups index.

### Phase 13 — Backups + DR

- §26 cron-driven `pg_dump` to R2 (versioned bucket); retention 30/90/365.
- Tested restore drill in CI weekly job.
- Tests: restore drill produces working app on staging.

### Phase 14 — Status page + maintenance + incident comms

- `status.ilinga.com` static SPA (§29) consuming `/v1/status`.
- `maintenance_windows` admin UI; banner appears app-wide during window.
- Tests: scheduled window flips banner on/off at boundary minute.

### Phase 15 — API tokens + developer platform

- §28 PATs + service accounts with scoped permissions.
- Public OpenAPI 3.1 spec, hosted at `https://api.ilinga.com/v1/openapi.json` and rendered at `/developers/docs`.
- Per-token rate limits + standard headers (`X-RateLimit-*`).
- API request log surface (Phase 11 data) with filters.
- Tests: scope enforcement; rate-limit headers correct; OpenAPI matches actual route schemas (lint).

### Phase 16 — Search + command palette + analytics

- §25 search across ventures, cycles, reports, content keys (Postgres FTS for now; vector search via §23.3 for content keys).
- Command palette (registered actions) — already mounted Phase 4; this phase wires search backend.
- §20 credit usage reports + analytics dashboards (per-tenant).
- Tests: search returns scoped results only; analytics SQL deterministic.

### Phase 17 — i18n + a11y + mobile polish

- §30 i18n scaffolding (en-GB at GA; copy externalised); locale-aware formatters.
- Full a11y pass: keyboard reachability for every interactive control; focus order; visible focus rings; reduced-motion paths; aria-live for streaming.
- Tablet read-only minimum on Dashboard, Reports, Credits, Settings; sidebar drawer ≤768px.
- Tests: axe a11y violations = 0 across all routes; PWA installable.

### Phase 18 — Anti-abuse hardening + observability completion

- §31 trimmed to magic-link auth: token bucket per (IP, route), HIBP not used (no passwords), CAPTCHA on `magic-link/request` risk, abuse signals.
- §24 OTel traces in every workflow path; Grafana dashboards for queue depth, p95 SSE latency, render queue, auto-topup, webhook delivery.
- Tests: load test 200 concurrent SSE + 50 RPS API stays within budget; abuse-attack simulations rate-limit and CAPTCHA-challenge correctly.

### Phase 19 — Pre-GA hardening

- §32 completeness checklist: every box ticked.
- Pen-test (external) findings remediated; SBOM generated; security.txt published.
- Production env final secrets rotation; runbooks for rotate/restore/incident.
- Soft launch: invite first 20 tenants, 7-day burn-in, monitor SLOs.
- Cut over GA.

---

### §37 Acceptance criteria summary

| Aspect                | Gate                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- |
| Lint + types          | `pnpm -r lint && pnpm -r typecheck` exit 0                                            |
| Unit + integration    | `pnpm -r test` ≥80% lines coverage on touched packages                                 |
| E2E                   | `pnpm e2e` passes; includes `no-dead-ui` crawl                                         |
| a11y                  | `axe-playwright` returns 0 violations on every shipped route                            |
| Performance           | LH ≥90 perf/a11y/best-practices on app shell + key flows; bundle budget 220kB gz initial |
| Streaming             | p95 event-to-frontend latency <500ms under 200 concurrent SSE clients on one cycle     |
| Empty / loading       | Every list shipped that phase has `<EmptyState>` and `<Skeleton>` paths                |
| No dead UI            | Crawler reports zero noop / `href="#"` / 404 routes                                    |
| Tenant isolation      | Every endpoint negative-tested across tenants; no leak                                  |
| Audit chain           | `pnpm audit:verify` validates the entire chain                                          |
| DR                    | Weekly restore drill green                                                              |



