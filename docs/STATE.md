# State of the system

Last updated: 2026-05-04. **This file is the single source of truth for what
works, what's stubbed, and what's missing.** Update it in the same commit as
the code change. Don't tick a box in `COMPLETION_CHECKLIST.md` without
flipping the matching row here first.

## How to use this file

- Each row has a status:
  - `done` — implemented, typecheck + tests green, observed working in dev,
    matches the acceptance criteria below.
  - `built-untested` — code exists and typechecks, but the happy path has
    not been exercised against real infra (real Cockroach, real provider,
    real webhook, etc.).
  - `stubbed` — placeholder code returns a canned value (e.g. ClamAV marks
    everything clean). Function shape is right; behaviour is fake.
  - `missing` — not built at all.
- Each row has a priority:
  - `P0` blocks GA: customers can't get value or data is unsafe without it.
  - `P1` degrades quality but won't stop a launch.
  - `P2` polish, demand-driven, or post-GA.
- "Acceptance" is what makes `done` truthful. If you can't verify all of
  it, the row stays in `built-untested`.

## Rules

1. **Read this file first thing every session.** The next slice is the
   highest-priority not-`done` row whose dependencies are met.
2. **Don't ask which gap to close.** Pick from the "Next up" stack below,
   build it, prove it, flip the row. Only ask the user when the work has
   real ambiguity (security trade-off, scope question, money).
3. **Verify, don't claim.** A row only flips to `done` when the acceptance
   criteria literally pass. If you ran a test, say so. If you didn't, leave
   it `built-untested`.
4. **Record every blocker.** If a row is stuck on something outside the
   repo (missing API key, infra not provisioned), say so in the Notes
   column and move to the next row — don't stall.

---

## Next up (in order)

1. n8n workflow JSON + dispatcher exercised end-to-end — P0
2. Sentry + OTel exporter wired (real, not no-ops) — P1
3. Public status page at `apps/status/` reading `platform_incidents` — P1
4. Trial banner + dunning email sequence — P1
5. Per-token rate limit + scope enforcement on API tokens — P1
6. Time-zone-aware rendering (`users.timezone` actually read by frontend) — P2
7. PostHog (self-hosted EU) wired behind cookie consent — P2
8. i18n: scaffold `fr` + `es` locale, remove en-GB-only assumption — P2

Each slice is its own commit.

---

## Auth + sessions

| Item                                            | Status         | P   | Files                                                                              | Acceptance                                                                |
| ----------------------------------------------- | -------------- | --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Magic link issue + verify                       | done           | P0  | `apps/api/src/lib/auth/magic-link.ts`, `routes/auth.ts`                            | Existing unit tests pass; mailpit captures email in dev                   |
| Google OAuth (auth code → JIT user)             | done           | P0  | `apps/api/src/lib/auth/oauth-google.ts`                                            | Round-trip test against stub IdP                                          |
| Sessions list + revoke + revoke-all             | done           | P0  | `apps/api/src/routes/sessions.ts`, `pages/app/settings/Sessions.tsx`               | UI lists, revoke flips `revokedAt`, next request 401s                     |
| Trusted devices list + forget                   | done           | P1  | `apps/api/src/routes/sessions.ts:GET/DELETE /devices`                              | UI surfaces all `user_trusted_devices` rows; DELETE flips `revokedAt`     |
| Account self-delete (soft + 7d hard)            | done           | P0  | `apps/api/src/lib/auth/users.ts`                                                   | Sessions revoked, tombstone + `users.deletedAt` set                       |
| Email change via magic-link (`metadata.userId`) | done           | P0  | `routes/auth.ts:consumeMagicLink` fold                                             | Verifying with a `userId` in metadata updates `users.email`               |
| New-device email alert                          | built-untested | P1  | `lib/auth/sessions.ts:notifyNewDeviceIfNeeded`                                     | Real Resend / Postmark roundtrip; "wasn't me" link revokes sessions       |
| Impersonation banner + end-impersonation        | done           | P1  | `lib/impersonation.ts`, `routes/auth.ts:GET /impersonation`, `routes/admin.ts:end` | Admin-active row → banner; click ends it; banner disappears               |
| hCaptcha gate on `/auth/magic-link/request`     | missing        | P1  | —                                                                                  | Captcha required when IP is flagged; bot-script E2E proves block          |
| Impossible-travel detector                      | missing        | P1  | `apps/workers/src/risk-evaluator.ts` (not built)                                   | Distance + 30 min window flag → email alert; "wasn't me" revokes sessions |

## Tenants + onboarding + members

| Item                                                           | Status         | P   | Files                                                        | Acceptance                                                                       |
| -------------------------------------------------------------- | -------------- | --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Workspace create from UI                                       | done           | P0  | `pages/onboarding/CreateWorkspace.tsx`, `routes/tenants.ts`  | First-run lands on create page; PATCH writes audit row                           |
| Members CRUD + invite + role + transfer + last-owner safeguard | done           | P0  | `lib/tenants/service.ts`                                     | Last-owner test covers downgrade + remove                                        |
| Workspace edit (name, brand logo, accent, custom domain)       | done           | P0  | `pages/app/settings/Workspace.tsx`                           | All fields PATCH; brand surfaces in invite emails (see Email row)                |
| Custom domain DNS verification                                 | stubbed        | P1  | `lib/tenants/service.ts:verifyCustomDomain`                  | Real TXT challenge served + verified before flip; admin click is a fallback only |
| Soft-delete tenant + 7-day restore + hard-delete               | built-untested | P0  | `lib/tenants/service.ts`, `apps/workers/src/retention.ts`    | Retention worker observed crossing the deadline in dev (set 1m window in test)   |
| Tenant brand → email shell                                     | done           | P1  | `packages/emails/src/render.ts:BrandInput`, `routes/auth.ts` | `tenant_invite` email shows the inviting workspace's logo + accent               |

## Ventures + cycles + interview

| Item                                                      | Status         | P   | Files                                                             | Acceptance                                                              |
| --------------------------------------------------------- | -------------- | --- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Venture create + brief + geos + industry                  | done           | P0  | `routes/ventures.ts`, `pages/app/VentureNew.tsx`                  | Form posts; venture appears in list                                     |
| Cycle clone (answers + competitors + artifact references) | done           | P0  | `lib/ventures/service.ts:cloneCycle`, integration test            | `ventures.integration.test.ts` covers clone                             |
| Cycle close + freeze + summary modal                      | done           | P0  | `lib/ventures/service.ts:closeCycle`                              | Frozen cycles 412 on writes                                             |
| Cycle compare (two cycles' reports + keys)                | done           | P0  | `pages/app/CycleCompare.tsx`                                      | Two cycles render side-by-side; key diffs highlighted                   |
| Optimistic-lock save with `If-Match` + 412 + merge UI     | done           | P0  | `routes/answers.ts`, `pages/app/Interview.tsx`                    | Two parallel saves with same version → second 412 with merge UI         |
| Live presence (heartbeat)                                 | built-untested | P1  | `lib/streaming/usePresenceBeacon.ts`, `routes/cycles.ts:presence` | Two browsers see each other's dots within ≤2s; SSE backplane via Valkey |

## Artifacts + competitors

| Item                                                   | Status         | P   | Files                                                     | Acceptance                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | -------------- | --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artifact upload UI (presigned PUT)                     | done           | P0  | `features/artifacts/Artifacts.tsx`, `routes/artifacts.ts` | Three-step (presign → PUT → finalise) lands in MinIO                                                                                                                                                                                                     |
| Artifact scan worker (ClamAV)                          | built-untested | P0  | `apps/workers/src/clamd.ts`, `clamd.test.ts`, `scan.ts`   | zINSTREAM client + protocol unit tests against mock TCP (clean/infected/size-limit/payload-verbatim/ping); worker calls clamd when `IL_CLAMD_HOST` set, dev fallback writes `no-clamd-configured`. Needs real clamd + EICAR file in dev to flip to done. |
| Artifact text extraction (pdf-parse / mammoth / plain) | built-untested | P0  | `apps/workers/src/extract.ts`, `extract.test.ts`          | text/\* + JSON path unit-tested + run green; PDF (pdf-parse@^2) + DOCX (mammoth@^1) paths code-correct but need exercising against a real upload. OCR (tesseract) is a follow-up.                                                                        |
| Competitor add + scrape (cheerio)                      | done           | P1  | `apps/workers/src/scrape.ts`                              | Per-tagged user-agent, 15s timeout, writes summary                                                                                                                                                                                                       |

## Synthesis + AI

| Item                                                                 | Status         | P   | Files                                                                               | Acceptance                                                                                                  |
| -------------------------------------------------------------------- | -------------- | --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Streaming AI providers (OpenAI + Anthropic)                          | done           | P0  | `lib/ai/openai.ts`, `lib/ai/anthropic.ts`                                           | Unit tests + a manual cycle with real key streams tokens                                                    |
| Tenant AI endpoint workload routing (tenant first → system fallback) | done           | P0  | `lib/ai/registry.ts:resolveWorkload`                                                | Test shows tenant primary used; on 5xx falls back to system                                                 |
| AI endpoint dry-run "Send test prompt"                               | done           | P1  | `routes/ai-endpoints.ts:/dry-run`, `pages/app/settings/Ai.tsx`                      | Real key + provider returns `pong`; bad key returns 502 with provider error                                 |
| Reducer step (multi-module conflict resolution)                      | done           | P0  | `lib/synthesis/reducer.ts`                                                          | Highest confidence wins; tied → most recent; unit-tested                                                    |
| Stakeholder responses fold into `content_keys`                       | done           | P0  | `lib/ventures/stakeholders.ts:submitStakeholderResponse`                            | Stakeholder POST → key with `source='stakeholder'` written                                                  |
| Cancellation endpoint (synthesis + render) + refund                  | built-untested | P0  | `routes/synthesis.ts`, `routes/reports.ts`                                          | Cancel mid-stream → `stream.cancelled`, ledger refund, no PDF; observed in dev                              |
| **n8n workflow JSON files committed + activated**                    | missing        | P0  | `infra/n8n/workflows/*.json` (none exist)                                           | The 6 workflows from the plan exist as JSON; n8n imports them; admin sees them green                        |
| **n8n dispatcher exercised end-to-end**                              | missing        | P0  | `routes/n8n.ts:callbacks`, `lib/n8n/dispatch.ts` (the dispatcher file is not built) | API signs payload → n8n executes → callbacks update `prompt_runs`; replay rejected; HMAC tampering rejected |
| n8n agent designer (admin Monaco + dry-run + promote)                | missing        | P2  | `routes/_admin/agents/*` (not built)                                                | Admin uploads JSON → validator allow-list passes → promote → next dispatch hits new version                 |

## Reports + render

| Item                                                     | Status         | P   | Files                                                                | Acceptance                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | -------------- | --- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Report grid + tier badges + locked tiles                 | done           | P0  | `pages/app/Reports.tsx`                                              | Tiles match catalog; price shown                                                                                                                                                                                                                                                                                                                                                                           |
| Render worker (Playwright PDF + HTML upload to R2/MinIO) | built-untested | P0  | `apps/workers/src/render.ts`, `playwright-pool.ts`, `render.test.ts` | Singleton chromium pool (2 contexts) + always-on render. `IL_RENDER_PDF_REQUIRED=true` (default in production) hard-fails the renderRow when Playwright/chromium isn't installed; dev keeps the soft fallback but writes the reason to `failureReason`. `pnpm playwright:install` provisions the binary at deploy. PDF + page-count parser unit-tested; need a real chromium + dev render to flip to done. |
| Render scheduler (re-render at `nextRunAt`)              | done           | P0  | `apps/workers/src/scheduler.ts`                                      | Cron tick observed firing in dev with a 1m schedule                                                                                                                                                                                                                                                                                                                                                        |
| Render cancel + refund                                   | built-untested | P0  | `routes/reports.ts:/cancel`                                          | Cancel during PDF stage → no PDF, credits refunded                                                                                                                                                                                                                                                                                                                                                         |
| Multi-format export (HTML / DOCX / PPTX / MD)            | missing        | P1  | `lib/render/{docx,pptx,md}.ts`                                       | Render writes 5 `report_render_artifacts`; viewer downloads each                                                                                                                                                                                                                                                                                                                                           |
| Tagged-PDF a11y + axe-core lint                          | missing        | P2  | `lib/render/a11y-lint.ts`                                            | Bad heading order fails CI; passes on system templates                                                                                                                                                                                                                                                                                                                                                     |

## Stakeholders

| Item                                             | Status | P   | Files                                      | Acceptance                                            |
| ------------------------------------------------ | ------ | --- | ------------------------------------------ | ----------------------------------------------------- |
| Invite + portal + free-text submit + opt-out     | done   | P0  | `routes/stakeholders.ts`, `pages/portal/*` | Bogus token → "no longer valid" page (E2E covers)     |
| Reminder cron (7-day no-response → notification) | done   | P0  | `apps/workers/src/reminders.ts`            | Hourly tick observed firing; notification row appears |

## Billing + credits

| Item                                                | Status         | P   | Files                                                                     | Acceptance                                                                           |
| --------------------------------------------------- | -------------- | --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Plans + checkout + webhook idempotency + auto-topup | done           | P0  | `routes/billing.ts`, `webhooks/dodo.ts`, `apps/workers/src/auto-topup.ts` | Mock webhooks idempotent; auto-topup observed crossing threshold in dev              |
| Coupon redemption                                   | done           | P1  | `routes/billing.ts:/coupons/redeem`, `pages/app/Settings.tsx`             | Form posts; expiry + max-redemptions enforced                                        |
| Plan upgrade proration preview                      | done           | P1  | `routes/billing.ts:/subscribe/preview`                                    | Preview shows prorated `dueToday` + full `nextCharge`                                |
| Subscription read-only enforcement                  | done           | P0  | `lib/middleware-extra.ts:enforceReadOnly`                                 | `unpaid`/`paused` blocks writes; banner surfaces                                     |
| **Trial banner + countdown**                        | missing        | P1  | `pages/app/dashboard/TrialBanner.tsx` (not built)                         | Banner shows above-fold while `subscriptions.status='trialing'` with days remaining  |
| **Dunning email sequence**                          | missing        | P1  | `apps/workers/src/dunning.ts` (not built)                                 | T+0 / T+3d / T+7d / T+14d unpaid / T+30d cancel emails fire on Dodo `payment.failed` |
| **Real Dodo webhook tested against live signature** | built-untested | P0  | `webhooks/dodo.ts`                                                        | Hit endpoint with real signed payload; ledger + sub updates land                     |

## Email + SMS + notifications

| Item                                                     | Status  | P   | Files                                                    | Acceptance                                                              |
| -------------------------------------------------------- | ------- | --- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Resend + Postmark + SMTP failover                        | done    | P0  | `packages/emails/src/sender.ts`                          | Health-aware failover unit-tested; real Resend send round-trip observed |
| Magic link / new-device / receipt / low-credit templates | done    | P0  | `packages/emails/src/templates.ts`                       | All four render through MJML in tests                                   |
| Brand pass-through (logo + accent)                       | done    | P1  | `packages/emails/src/render.ts:BrandInput`               | Tenant invite email displays workspace brand                            |
| Notification inbox + mark-read                           | done    | P0  | `routes/notifications.ts`, `pages/app/Notifications.tsx` | UI lists; PATCH flips `readAt`                                          |
| Comment @-mention notifications                          | done    | P1  | `routes/comments.ts`                                     | Mention writes a `notifications` row with `kind='comment.mention'`      |
| **SMS path (Twilio + MessageBird + Africa)**             | missing | P2  | `lib/sms/*` (not built)                                  | SMS OTP / portal-link send works in dev with Twilio mock                |
| **Suppression list (bounce/complaint/STOP webhooks)**    | missing | P1  | `webhooks/{resend,postmark}.ts`                          | Bounce → suppression row; next send to that addr blocked                |

## Search + palette + activity + sessions

| Item                        | Status | P   | Files                                                     | Acceptance                                    |
| --------------------------- | ------ | --- | --------------------------------------------------------- | --------------------------------------------- |
| Search backend + ⌘K palette | done   | P0  | `routes/search.ts`, `features/palette/CommandPalette.tsx` | Palette opens on ⌘K, types resolve; navigates |
| Activity feed page          | done   | P0  | `pages/app/Activity.tsx`, `routes/activity.ts`            | Reads `audit_log` filtered + humanised        |

## Streaming (SSE)

| Item                                                    | Status         | P   | Files                                 | Acceptance                                                                                             |
| ------------------------------------------------------- | -------------- | --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| SSE hub + Valkey backplane                              | built-untested | P0  | `lib/sse/hub.ts`, `lib/sse/server.ts` | Two API workers; events from worker A reach client on worker B; reconnect with `Last-Event-ID` resumes |
| `useEventStream` hook + per-cycle/module/report streams | built-untested | P0  | `lib/streaming/useEventStream.ts`     | Real synthesis run streams tokens into UI typewriter                                                   |

## Rate limit + security + audit

| Item                                          | Status         | P   | Files                                                                                                            | Acceptance                                                  |
| --------------------------------------------- | -------------- | --- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Global write rate-limit (token bucket per IP) | done           | P0  | `lib/middleware-extra.ts:globalWriteLimit`                                                                       | 6th write in 1s returns 429 with `Retry-After`              |
| Per-tenant API request log writer + viewer    | done           | P0  | `lib/middleware-extra.ts:apiRequestLog`, `routes/tenants.ts:/api-requests`, `pages/app/settings/ApiRequests.tsx` | Last 200 visible to owner/admin                             |
| **API token scopes enforced on routes**       | missing        | P1  | `routes/api-tokens.ts` issues tokens with scopes; middleware doesn't check them                                  | Token without `write:ventures` → 403 on POST `/v1/ventures` |
| **Per-token rate limit**                      | missing        | P1  | `lib/middleware-extra.ts`                                                                                        | `X-RateLimit-*` headers per token; 429 when bucket empty    |
| Hash-chained audit log                        | done           | P0  | `lib/audit/log.ts`                                                                                               | Tamper test fails verifier                                  |
| CSP / HSTS / COEP at Caddy                    | done           | P0  | `infra/caddy/Caddyfile`                                                                                          | securityheaders.com >=A grade (manual)                      |
| **SSRF guard on outbound webhooks**           | built-untested | P1  | `lib/url-allowlist.ts` (need to confirm exists)                                                                  | Posting to `169.254.x` rejected at deliver-time             |
| **OpenAPI spec + Swagger UI at `/docs`**      | missing        | P1  | `lib/openapi.ts` (file exists, content thin)                                                                     | All routes appear with zod-derived schemas                  |

## Compliance

| Item                                   | Status         | P   | Files                                               | Acceptance                                                   |
| -------------------------------------- | -------------- | --- | --------------------------------------------------- | ------------------------------------------------------------ |
| DSAR request + admin resolve           | done           | P0  | `routes/admin.ts`                                   | DSAR row created; admin marks resolved with audit            |
| Data export (tarball + signed URL 24h) | built-untested | P0  | `apps/workers/src/data-export.ts` (need to confirm) | Owner triggers export → downloadable tarball with all tables |
| Tenant deletion (dry-run + real)       | built-untested | P0  | `lib/tenants/service.ts`                            | Dry-run returns counts; real cascade-deletes                 |
| Maintenance window admin               | done           | P1  | `routes/admin.ts:/maintenance`                      | Banner appears when active                                   |
| Cookie consent + DNT                   | done           | P0  | `lib/consent.tsx`, `components/CookieBanner.tsx`    | EU default blocks analytics until consented                  |

## Observability + status

| Item                                                | Status         | P   | Files                                     | Acceptance                                                                |
| --------------------------------------------------- | -------------- | --- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Pino logger + redaction                             | done           | P0  | `lib/logger.ts`                           | Snapshot test confirms PII not serialised                                 |
| **Sentry (`@sentry/node`, `@sentry/react`)**        | missing        | P1  | `lib/observability.ts` (no-op shim today) | Triggered error reaches Sentry mock with release tag                      |
| **OpenTelemetry exporter (`@opentelemetry/*` SDK)** | missing        | P1  | `lib/observability.ts` (no-op shim today) | Spans correlate with log lines via `traceparent`; OTLP collector receives |
| Prometheus `/internal/metrics`                      | built-untested | P1  | `routes/internal.ts` (need to confirm)    | After a few requests, counters reflect them                               |
| **Public status page (`apps/status/`)**             | missing        | P1  | `apps/status/` (directory empty)          | Reads from `platform_incidents`; updates within 30s of admin posting      |
| Better Uptime / Pingdom probes                      | missing        | P1  | `infra/probes.tf` (not built)             | Probes hit `/healthz` from 3 regions; SLO dashboards populated            |

## Tests + verification

| Item                                                             | Status  | P   | Files                                                         | Acceptance                                                                       |
| ---------------------------------------------------------------- | ------- | --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Unit tests                                                       | done    | P0  | `apps/api/src/**/*.test.ts`, `apps/web/src/**/*.test.tsx`     | 79 pass green (45 API + 34 web)                                                  |
| Integration tests written                                        | done    | P0  | `apps/api/src/integration/`                                   | Files exist; transactional rollback set up                                       |
| **Integration tests run against real Cockroach + Redis + MinIO** | missing | P0  | `apps/api/src/integration/_setup.ts`                          | `pnpm --filter @ilinga/api test:integration` runs green against `make dev` stack |
| Playwright E2E (public golden path + error pages + portal)       | done    | P1  | `apps/web/e2e/golden-path.spec.ts`                            | Already pass without API                                                         |
| **Playwright E2E (authenticated flows)**                         | missing | P0  | `apps/web/e2e/authenticated.spec.ts` (not built)              | Sign in → create venture → answer → render → download PDF, against `make dev`    |
| **No-dead-UI Playwright crawl**                                  | missing | P1  | `apps/web/e2e/no-dead-ui.spec.ts` (file exists, content thin) | Walks every reachable route; every visible button does something observable      |
| **a11y CI suite (axe-core)**                                     | missing | P1  | `apps/web/e2e/a11y.spec.ts` (file exists, content thin)       | Zero critical violations on every authenticated route                            |
| **Load tests (k6)**                                              | missing | P1  | `infra/loadtests/*.js` (not built)                            | Auth p95 <500ms, render p95 <30s, synth p95 <8s under 200 concurrent             |
| **Backup + restore drill**                                       | missing | P0  | `infra/scripts/restore-drill.sh`                              | Monthly cron observed succeeding                                                 |
| **Chaos drill (kill API node mid-load)**                         | missing | P1  | `infra/scripts/chaos.sh`                                      | No 5xx during graceful drain                                                     |

## Polish + UX gaps

| Item                                                    | Status  | P   | Files                                                   | Acceptance                                                                           |
| ------------------------------------------------------- | ------- | --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Empty states on every list                              | done    | P1  | `components/EmptyState.tsx` users                       | Each list shows illustrated empty state with CTA                                     |
| Skeleton loaders                                        | done    | P1  | `components/Skeleton.tsx` users                         | Each async view shows a skeleton                                                     |
| Global error boundary + toast + zod field-error mapping | done    | P1  | `components/ErrorBoundary.tsx`, `lib/zod-error.ts`      | 500 surfaces toast + sets focus to first invalid field                               |
| Sidebar drawer ≤768px                                   | done    | P1  | `layouts/AppLayout.tsx`                                 | Mobile: hamburger opens drawer; desktop: fixed sidebar                               |
| **Time-zone-aware rendering (read `users.timezone`)**   | missing | P2  | `lib/format.ts:formatDateTZ` always called with `'UTC'` | Two users with different TZs see same `created_at` rendered correctly                |
| **23h idle re-auth modal w/ form persist**              | missing | P2  | `lib/useFormPersist.ts` (not built)                     | Idle 23h → modal; re-auth restores form state                                        |
| **PostHog (self-hosted EU) behind cookie consent**      | missing | P2  | `lib/analytics.ts` (not built)                          | After consent, `cycle_started` etc fire; before consent, none                        |
| **Help docs at `/help` (MDX)**                          | missing | P2  | `apps/web/src/content/help/*.mdx` (empty)               | At least 8 articles; `?` opens contextual drawer                                     |
| **Marketing landing depth + pricing compare table**     | missing | P2  | `pages/marketing/*`                                     | Compare-plans table; FAQ; testimonials section                                       |
| **Demo / sample-data tenant**                           | missing | P2  | `lib/demo.ts` (not built)                               | New tenant gets seeded "Northwind Cargo" cycle; one-click reset; cannot bill credits |
| **i18n scaffolding for fr + es**                        | missing | P2  | `apps/web/locales/fr/*.json` (not built)                | Locale switch in profile updates UI strings + date formats                           |

## Infra + deployment

| Item                                                | Status  | P   | Files                                                     | Acceptance                                                     |
| --------------------------------------------------- | ------- | --- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Drizzle migrations + `pnpm db:migrate`              | done    | P0  | `packages/db/migrations/0000_*.sql`                       | Down → up clean                                                |
| Docker compose for local dev                        | done    | P0  | `docker-compose.yml` (need to confirm)                    | `make dev` boots cockroach, valkey, minio, mailpit, n8n        |
| Caddy + PM2 + GeoDNS configs                        | done    | P1  | `infra/caddy/Caddyfile`, `infra/pm2/ecosystem.config.cjs` | EU VM smoke test passes                                        |
| **Backup config (Cockroach Cloud + R2 versioning)** | missing | P0  | `infra/backup/*.tf` (need to confirm)                     | Backups run nightly; R2 has object-lock on `audit_log` exports |
| **GitHub Actions CI**                               | removed | —   | —                                                         | User explicitly removed; not coming back unless asked          |

## Marketing + legal + error pages

| Item                                                          | Status         | P   | Files                                                       | Acceptance                                                                                                              |
| ------------------------------------------------------------- | -------------- | --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Marketing landing                                             | done           | P0  | `pages/marketing/Home.tsx`                                  | Renders the hero + features; covered by golden-path E2E                                                                 |
| Pricing page + compare table                                  | built-untested | P0  | `pages/marketing/Pricing.tsx`                               | Reads `/v1/billing/plans`; compare table side-by-side; "Get started" → sign-up                                          |
| Contact + Developers + Help index                             | built-untested | P1  | `pages/marketing/{Contact,Developers,Help,HelpArticle}.tsx` | Pages exist + render; Help has at least 8 articles in MDX (currently has placeholders)                                  |
| Legal pages (Terms / Privacy / Cookies / DPA / Subprocessors) | built-untested | P0  | `pages/marketing/Legal.tsx`, `content/legal/*.mdx`          | All five render; sign-up records `terms_accepted_v=<hash>` in `audit_log`                                               |
| Error catalogue (403 / 429 / 500 / 503 / offline / read-only) | done           | P1  | `pages/errors/ErrorPages.tsx`                               | All six render with "Back home" link (golden-path E2E covers this)                                                      |
| Public status page (read API)                                 | built-untested | P1  | `pages/marketing/Status.tsx`, `routes/status.ts`            | Reads `platform_incidents`; updates within 30s of admin posting (separate from public-page-as-app row in Observability) |

## Admin

| Item                            | Status  | P   | Files                                                              | Acceptance                                                                     |
| ------------------------------- | ------- | --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Admin layout + overview         | done    | P1  | `pages/admin/AdminLayout.tsx`, `AdminOverview.tsx`                 | Platform-admin role guard; sidebar nav                                         |
| DSAR queue + resolve            | done    | P0  | `pages/admin/AdminDsar.tsx`, `routes/admin.ts`                     | Admin sees pending DSARs; resolve writes audit                                 |
| Maintenance windows CRUD        | done    | P1  | `pages/admin/AdminMaintenance.tsx`, `routes/admin.ts:/maintenance` | Active window → banner across the app                                          |
| Impersonate + end-impersonation | done    | P1  | `pages/admin/AdminImpersonate.tsx`, `routes/admin.ts:/impersonate` | Admin starts impersonation; banner shows on target's session; admin can end it |
| Audit log admin filter UI       | missing | P1  | — (pages/admin/AdminAudit.tsx not built)                           | Admin can filter audit log by tenant, actor, action, time range                |

## Outbound webhooks + integrations

| Item                                                  | Status         | P   | Files                                                            | Acceptance                                                                           |
| ----------------------------------------------------- | -------------- | --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Webhook endpoints CRUD + UI                           | done           | P0  | `routes/webhooks.ts`, `pages/app/settings/Webhooks.tsx`          | Tenant adds endpoint; HMAC secret generated; `Send test event` button posts a sample |
| Webhook delivery worker (sign + retry + dead-letter)  | built-untested | P0  | `apps/workers/src/webhook-deliverer.ts` (need to confirm exists) | Signed POST with backoff; dead-letter after 8 attempts; replay log visible           |
| Inbound n8n callbacks (HMAC + replay)                 | built-untested | P0  | `routes/n8n.ts`, `lib/n8n/hmac.ts`                               | Signed body verifies; replay (same nonce) rejected; bad signature 401                |
| Inbound Dodo webhooks (signature verify + idempotent) | built-untested | P0  | `lib/billing/dodo.ts`, `webhooks/dodo` route                     | Real Dodo signed payload → ledger + sub updates land; duplicate `event.id` no-ops    |

## Cycle / module / output UI surfaces

| Item                                       | Status         | P   | Files                                                 | Acceptance                                                          |
| ------------------------------------------ | -------------- | --- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| Cycle reports list page                    | done           | P0  | `pages/app/CycleReports.tsx`                          | Lists rendered + scheduled reports for a cycle                      |
| Cycle compare (two cycles side-by-side)    | done           | P0  | `pages/app/CycleCompare.tsx`                          | Reports + keys diffed; tested manually                              |
| Synthesis pipeline page (live stages)      | built-untested | P0  | `pages/app/Synthesis.tsx`, `features/synthesis/*`     | Stage cards transition queued→running→done driven by SSE events     |
| Content keys viewer                        | done           | P1  | `pages/app/ContentKeys.tsx`, `routes/content-keys.ts` | Lists all current keys; clicking shows version history              |
| Trash + restore page                       | built-untested | P1  | `pages/app/Trash.tsx`, `routes/trash.ts`              | Restore within 30d works; hard-delete after retention worker firing |
| Venture edit                               | done           | P0  | `pages/app/VentureEdit.tsx`                           | Brief, geos, industry editable                                      |
| Report viewer + share-link + password gate | built-untested | P1  | `pages/app/ReportViewer.tsx`                          | Public viewer renders behind password; HTML/PDF download links work |

## Bug report + feedback

| Item                                | Status         | P   | Files                                                         | Acceptance                                                                 |
| ----------------------------------- | -------------- | --- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Bug-report widget + ingest endpoint | built-untested | P1  | `features/bug-report/BugReportWidget.tsx`, `routes/_stub.ts`? | Widget POSTs description + screenshot; stored as audit row + Sentry attach |

## Crypto / KMS

| Item                                     | Status  | P   | Files                                                         | Acceptance                                                                                                   |
| ---------------------------------------- | ------- | --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| KMS envelope encryption (env-stored KEK) | done    | P0  | `apps/api/src/lib/crypto.ts`, `packages/db/src/kms.ts`        | DEK wrap/unwrap round-trip + tamper test; existing unit tests                                                |
| KEK rotation script                      | missing | P0  | `packages/db/scripts/rotate-kek.ts` (not built)               | Run against staging: re-wrap every DEK with new KEK; ciphertext unchanged; old KEK still valid for read-only |
| Managed-KMS adapter (AWS KMS / GCP KMS)  | missing | P2  | `lib/kms/managed.ts` (not built; required before SOC 2 audit) | Adapter interface; one cloud provider implemented + integration test                                         |

---

## Updating this file

When you finish a slice:

1. Flip the row's status (`missing` → `built-untested` → `done`).
2. If `done`, the acceptance line literally happened — no hopeful ticking.
3. Cross the row off "Next up" and add the next P0 if needed.
4. Commit this file in the same commit as the code change. The commit
   message references which row(s) flipped.
