# Completion checklist (honest gap audit)

Last updated: 2026-05-03. Each item lists owning file(s) and the tests that
prove it works. Boxes are ticked only when the code exists, the test runs
green, and the path has been exercised end-to-end.

## Onboarding + tenancy

- [x] Sign-up via magic link / Google
  - `apps/api/src/routes/auth.ts`, `apps/web/src/pages/auth/SignIn.tsx`
- [ ] First-time user can create a workspace from the UI
  - `apps/web/src/pages/onboarding/CreateWorkspace.tsx`
  - test: `apps/api/src/routes/tenants.create.test.ts` (POST /v1/tenants happy path)
- [ ] Magic-link `purpose=tenant_invite` actually adds the user to the tenant
  - `apps/api/src/lib/auth/magic-link.ts` consume side
  - `apps/api/src/routes/auth.ts` verify handler honours metadata
  - test: `apps/api/src/routes/auth.invite.test.ts`
- [ ] Workspace edit (rename, region, country, industry)
  - `apps/api/src/routes/tenants.ts` PATCH
  - `apps/web/src/pages/app/settings/Workspace.tsx`
- [ ] Brand picker (logo URL + accent hex)
  - `apps/web/src/pages/app/settings/Brand.tsx`
  - test: PATCH /tenants/:tid/brand updates row
- [ ] Custom-domain onboarding (claim + verify-DNS state machine)
  - `apps/api/src/routes/tenants.ts` domain endpoints
  - `apps/web/src/pages/app/settings/CustomDomain.tsx`
- [x] Members CRUD + role + transfer + last-owner safeguard
  - tested via `apps/api/src/lib/tenants/service.test.ts`

## Ventures + cycles

- [x] Create venture (brief, geos, industry)
- [ ] Full brief editor (thesis, wedge, asks) — currently a `window.prompt`
  - `apps/web/src/pages/app/VentureEdit.tsx`
- [x] Clone cycle
- [ ] Close + freeze cycle (with confirm modal listing frozen artifacts)
  - `apps/api/src/routes/ventures.ts` POST /cycles/:cid/close
  - `apps/web/src/pages/app/VentureDetail.tsx` close action
- [ ] Compare two cycles' reports / keys side-by-side
  - `apps/api/src/routes/ventures.ts` GET /cycles/compare
  - `apps/web/src/pages/app/CycleCompare.tsx`

## Artifacts + competitors

- [ ] Artifact upload UI (presigned PUT)
  - `apps/api/src/routes/artifacts.ts` POST /presign
  - `apps/web/src/features/artifacts/ArtifactUpload.tsx`
  - test: `presign.test.ts` returns a signed URL with expected fields
- [ ] Artifact list + extraction status display
- [ ] ClamAV scan worker integrated (currently always 'clean')
  - `apps/workers/src/scan.ts` real adapter
- [ ] Artifact text-extraction worker (PDF/DOCX/PPTX/image OCR)
  - `apps/workers/src/extract.ts`
- [ ] Competitor add UI (URL + label)
  - `apps/api/src/routes/competitors.ts`
  - `apps/web/src/features/competitors/CompetitorList.tsx`
- [ ] Competitor scrape worker
  - `apps/workers/src/scrape.ts`

## Interview

- [x] Question list with cluster grouping
- [x] Optimistic-lock save with 412 + merge UI
- [x] Comments on answers
- [x] Live presence dots
- [ ] Industry-specific question packs (only one set seeded today)
  - `packages/db/src/seed/data/questions.ts` adds packs
- [ ] Stakeholder per-question scoping (restrict which questions a
      stakeholder can see/answer)

## Synthesis

- [x] Streaming AI providers (OpenAI + Anthropic)
- [x] Cancellation
- [ ] Synthesis runs in a BullMQ worker, not in-process in the API route
  - `apps/workers/src/synthesis.ts`
  - the route enqueues and returns 202
- [ ] Reducer step that resolves conflicts when multiple modules write the
      same key
  - `apps/api/src/lib/synthesis/reducer.ts`
  - test: `reducer.test.ts` with two competing module outputs
- [ ] AI endpoint resolution honours `tenant_ai_endpoints.workloads`
  - `apps/api/src/lib/ai/registry.ts` resolveTenantWorkload
- [ ] Stakeholder responses fold into content keys

## Reports

- [x] Render + viewer + cancel
- [x] Schedule a future re-render
- [ ] Render runs in the BullMQ worker (currently synchronous in the route)
  - `apps/api/src/routes/reports.ts` enqueues
  - `apps/workers/src/render.ts` does the actual Handlebars + Playwright
    - S3 upload + emits render.\* SSE
  - test: enqueue + worker fixture renders to a deterministic stub
- [ ] Scheduled re-render worker actually fires
  - `apps/workers/src/scheduler.ts`
- [ ] Compare two cycles' reports side-by-side (UI lands above)

## Stakeholders

- [x] Invite + portal + free-text submit + opt-out
- [ ] Reminder cron (default 7d after invite, halts on first response)
  - `apps/workers/src/stakeholder-reminders.ts`

## Billing

- [x] Plans, checkout, webhook idempotency, auto-topup config
- [ ] Auto-topup actually triggers when balance crosses threshold
  - `apps/api/src/lib/billing/credits.ts` calls maybeAutoTopUp on every
    debit; today nothing calls it
- [ ] Invoice PDF generation (currently nullable pdfS3Key)
  - `apps/workers/src/invoice-pdf.ts`

## Customer portal

- [ ] Portal-mode layout (no Settings → Billing; Venture/Interview/Reports
      only) selected by host header
  - `apps/web/src/layouts/PortalLayout.tsx`
- [ ] Custom-domain onboarding state machine (DNS check → cert issuance
      ack → branded landing)

## Search + palette + activity

- [x] Search backend
- [ ] Frontend ⌘K command palette
  - `apps/web/src/features/palette/CommandPalette.tsx`
- [ ] Activity feed page reads /v1/activity/tenant/:tid/cycle/:cid
  - `apps/web/src/pages/app/Activity.tsx`

## Rate limits + security

- [ ] Rate-limit middleware applied uniformly to every write route class
  - `apps/api/src/lib/rate-limit.ts` + `apps/api/src/app.ts` wiring
- [x] CSP / HSTS / COEP at Caddy
- [ ] Per-tenant API request log writer
  - `apps/api/src/lib/middleware.ts` writes to api_request_log

## Database

- [ ] Drizzle migrations generated from schema (only 0000_init.sql exists
      today; tables don't actually get created by `pnpm db:migrate`)
  - `packages/db/migrations/0001_*.sql` produced by `pnpm db:generate`

## Tests

- [x] Unit tests for KMS, audit chain, tenant scope, AI provider, HMAC,
      Handlebars, sender failover, sse hub, dodo signature, rate-limit
- [ ] Integration tests against a live Cockroach (turbo `test:integration`)
  - `apps/api/src/integration/tenants.integration.test.ts`
  - `apps/api/src/integration/ventures.integration.test.ts`
  - `apps/api/src/integration/answers.integration.test.ts`
  - `apps/api/src/integration/reports.integration.test.ts`
- [ ] Playwright E2E that walks: signup → create workspace → create
      venture → answer interview → run synthesis → render report
  - `apps/web/e2e/golden-path.spec.ts`

---

This file is the contract. The code changes that land alongside it MUST tick
the box and reference the test that proves it.
