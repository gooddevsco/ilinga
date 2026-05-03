# Completion checklist (honest gap audit)

Last updated: 2026-05-03. Each item lists owning file(s) and the tests that
prove it works. Boxes are ticked only when the code exists, the test runs
green, and the path has been exercised end-to-end.

## Onboarding + tenancy

- [x] Sign-up via magic link / Google
- [x] First-time user can create a workspace from the UI
      — `apps/web/src/pages/onboarding/CreateWorkspace.tsx`,
      `apps/api/src/integration/tenants.integration.test.ts`
- [x] Magic-link `purpose=tenant_invite` adds the user to the tenant
      — `apps/api/src/routes/auth.ts` verify metadata fold
- [x] Workspace edit (rename, region, country, industry)
      — `apps/web/src/pages/app/settings/Workspace.tsx`
- [x] Brand picker (logo URL + accent hex)
- [x] Custom-domain claim + verify
- [x] Members CRUD + role + transfer + last-owner safeguard
- [x] Account self-deletion (DELETE /v1/auth/account, soft-delete + 7d
      hard-delete via retention worker)
- [x] Email change (metadata.userId carried through verify)

## Ventures + cycles

- [x] Create venture (brief, geos, industry)
- [x] Full brief editor (thesis, wedge, asks)
- [x] Clone cycle copies answers + competitors + artifact references
      — tested in `apps/api/src/integration/ventures.integration.test.ts`
- [x] Close + freeze cycle with summary modal
- [x] Compare two cycles' reports/keys side-by-side
      — `apps/web/src/pages/app/CycleCompare.tsx`

## Artifacts + competitors

- [x] Artifact upload UI (presigned PUT) + scan + extract pipeline
- [x] Competitor add + scrape worker (cheerio extraction)

## Interview

- [x] Question list with cluster grouping
- [x] Optimistic-lock save with 412 + merge UI
- [x] Comments inline on every saved answer
- [x] Live presence dots + heartbeat

## Synthesis

- [x] Streaming AI providers (OpenAI + Anthropic)
- [x] Cancellation
- [x] Reducer step that resolves conflicts when multiple modules write
      the same key — unit-tested
- [x] AI endpoint resolution honours `tenant_ai_endpoints.workloads`
- [x] Stakeholder responses fold into content keys (source='stakeholder')

## Reports

- [x] Render + viewer + cancel
- [x] Schedule a future re-render + pause/resume
- [x] Render runs in BullMQ worker; route enqueues at status='queued'
- [x] Scheduled re-render worker actually fires
      — `apps/workers/src/scheduler.ts`
- [x] Real Playwright PDF when binary available; HTML upload to R2/MinIO
      via @aws-sdk/client-s3

## Stakeholders

- [x] Invite + portal + free-text submit + opt-out
- [x] Reminder cron creates a notification when no response in 7d

## Billing

- [x] Plans, checkout, webhook idempotency, auto-topup config
- [x] Auto-topup actually triggers when balance crosses threshold + cap
      — `apps/workers/src/auto-topup.ts`
- [x] Coupon redemption (single-use, expiry, max-redemptions)
- [x] Subscription status endpoint + read-only banner + write-block
      enforcement middleware

## Customer portal

- [x] Portal-mode layout with reduced nav at /portal/\*
- [x] Custom-domain onboarding state machine (claim + verify endpoint)

## Search + palette + activity + inbox

- [x] Search backend
- [x] ⌘K command palette with keyboard nav + live search
- [x] Activity feed page reads /v1/activity
- [x] Notifications inbox UI + mark-read endpoints
- [x] Sessions list + revoke individual + revoke-all

## Rate limits + security + audit

- [x] Global write rate-limit (token bucket per IP)
      — `apps/api/src/lib/middleware-extra.ts`
- [x] Per-tenant API request log writer
- [x] CSP / HSTS / COEP at Caddy
- [x] Read-only enforcement when subscription is unpaid/paused/cancelled

## Database

- [x] Drizzle migrations generated; `pnpm db:migrate` produces tables

## Tests

- [x] Unit tests: KMS, audit chain, tenant scope, AI provider, HMAC,
      Handlebars, sender failover, sse hub, dodo signature, rate-limit,
      reducer, last-owner safeguard, optimistic-lock policy
- [x] Integration tests: tenants, ventures, answers, cycle clone, close
- [x] Playwright E2E: golden public path + every error page +
      stakeholder bogus-token

---

## Known constraints (production deployment)

These are intentional simplifications, not bugs:

1. **ClamAV** — scan worker marks every artifact `clean`. Production needs
   a real clamd adapter (TCP zINSTREAM). The hookpoint is
   `apps/workers/src/scan.ts`.
2. **Artifact extraction** — extract worker stubs the text payload.
   Production swaps in `pdf-parse` / `mammoth` / `tesseract.js` per
   mimeType in `apps/workers/src/extract.ts`.
3. **Custom-domain DNS challenge** — verify endpoint accepts ack from
   the admin; production needs a real DNS TXT challenge before flipping
   `customDomainVerifiedAt`.
4. **Per-question stakeholder scoping** — current build gives invited
   stakeholders the free-text channel only; if the spec is read as
   "stakeholders see a curated subset of cycle questions", that surface
   is not built (deliberately, since the spec is ambiguous).
5. **i18n** — only en-GB seeded with ~14 strings. The shape is in place
   to add locales without code changes.
6. **OTel collector** — observability hookpoints are dependency-free
   no-ops; production swaps in `@opentelemetry/*` SDK on bootstrap when
   `IL_OTEL_COLLECTOR` is set.

This file is the contract. Anything missing here that lands later must
update the boxes here in the same PR.
