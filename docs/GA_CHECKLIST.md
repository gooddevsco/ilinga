# GA checklist (Phase 19 sign-off)

Mark each item as the rollout team verifies it. No GA cutover until every
box is ticked.

## Build

- [ ] `pnpm lint` clean across every package
- [ ] `pnpm typecheck` clean across every package
- [ ] `pnpm test` ≥80% line coverage on touched packages
- [ ] `pnpm test:integration` clean against a fresh Cockroach + Valkey
- [ ] `pnpm e2e` and `pnpm e2e:no-dead-ui` clean
- [ ] `pnpm a11y` clean (axe-core wcag2a + wcag2aa)
- [ ] `pnpm lighthouse` perf/a11y/best-practices ≥ 90

## Auth + privacy

- [ ] Magic-link flow: signup, signin, invite, email_change, recovery, step-up
- [ ] Google OAuth + verified-email gate
- [ ] CSRF double-submit on every mutating route
- [ ] Re-auth modal at 23h preserves form state
- [ ] Cookie consent versioned record landed
- [ ] DSAR queue accepts requests, admin can resolve
- [ ] Audit chain verifier passes against production data

## Tenancy

- [ ] Last-owner safeguard enforced
- [ ] Soft-delete + 30d restore for ventures, 7d for tenants
- [ ] Demo tenant boots with seeded Northwind Cargo cycle
- [ ] Custom domain on-demand TLS issuance dry-run

## Billing

- [ ] Dodo webhook idempotency under replay
- [ ] Auto top-up respects monthly cap
- [ ] Invoice PDFs include company name + VAT id
- [ ] Read-only mode disables every write button on unpaid

## Streaming + cancellation

- [ ] 200 concurrent SSE clients on one cycle, p95 latency < 500ms
- [ ] Mid-stream cancel refunds unused credits
- [ ] Reconnect via Last-Event-ID resumes without dupes

## Observability

- [ ] OTel traces flowing into Tempo
- [ ] Pino logs structured, redacting sensitive fields
- [ ] Status page reflects maintenance windows in real time

## DR

- [ ] Weekly restore drill green for 4 consecutive weeks
- [ ] Backup retention 30/90/365 lifecycle confirmed in R2

## Security

- [ ] SBOM generated and stored
- [ ] security.txt published at /.well-known
- [ ] External pen-test findings remediated
- [ ] Renovate + pnpm audit running in CI

## Soft launch

- [ ] First 20 tenants invited
- [ ] 7-day burn-in with no Sev 1 or 2
- [ ] Cut over GA — flip marketing CTAs from waitlist to signup
