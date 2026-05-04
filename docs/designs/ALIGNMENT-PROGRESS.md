# Design alignment — done

This is a self-replicating instruction file. If you are picking this work up
mid-stream:

1. Read `docs/designs/styles.css` and the relevant `docs/designs/*.jsx` for
   any page you want to refine.
2. Run `pnpm test` from the repo root — should report 100 tests across 4
   packages: 41 API unit + 14 API integration + 26 UI primitive + 32 web
   sequential + 1 worker (totals fluctuate as new tests are added).
3. When making a structural change to a page, drop a phase test under
   `apps/web/src/__sequential__/NN-name.test.tsx` so any future regression is
   caught by the suite.
4. Stub `EventSource` is provided in `apps/web/test/setup.ts` for pages that
   render SSE features (Interview, Synthesis, ReportViewer).
5. Update this file with any new bugs found, but never delete history.

## Done — every page

- [x] **Foundation** — design tokens + every utility class in
      [packages/ui/src/styles.css](../../packages/ui/src/styles.css). Earth
      palette (paper/ink/signal/ochre/indigo/green ladders); legacy
      `--color-*` aliases preserved so call sites that haven't been touched
      still render in the new palette.
- [x] **Primitives** — `Button` (.btn variants), `Card` (flat hairline),
      `Input/Textarea/Field`, `Tag`, `Eyebrow`, `Kbd`, `ProgressBar`, `Toggle`,
      `OtpInput`, `IconLogo` + 30 hairline glyphs.
- [x] **Layouts** — `AppLayout` (brand pill + workspace switcher + nav +
      credits + topbar + mobile drawer); `AuthLayout` (auth-split + Adinkra
      art pane); `MarketingLayout` (sticky backdrop-blurred topbar).
- [x] **Marketing** — `Home` (mixed-typeface hero + HeroArtifact + proof +
      4-step loop + report previews + 4-tier pricing + footer).
- [x] **Auth** — `SignIn` (welcome + magic/password mode toggle + sent state),
      `SignUp` (account step with role chips + terms gate), `Callback` (spinner + friendly failure).
- [x] **Onboarding** — `WorkspaceNew` (live preview + team-size chips),
      `VentureNew` (scope chooser + brief preview rail), `Ventures` (cards w/
      industry tag), `Dashboard` (first-run vs active hero + KPI grid + venture
      table + activity).
- [x] **Venture flow** — `VentureDetail` (brief-locked card + cycles list with
      tonal status tags), `Interview` (3-column shell: progress map + active
      cluster + agent rail), `Synthesis` (6-stage pipeline strip + brief context + stage map + live agent stream), `ContentKeys` aka Outputs (modules rail + key detail with version + confidence + override).
- [x] **Reports** — `Reports` (template gallery + filter pills),
      `CycleReports` (templates row + cmp ledger), `ReportViewer` (paper page
      on dark `#1A1A1D` shell, with TOC-style sections, keys table, render
      list, comments).
- [x] **Account** — `Credits` (64px mono balance + burn rate + 4-up packs +
      cmp ledger + invoices + auto-topup modal with `Toggle`); `Trash` (cmp
      table); `Settings` (220px nav with three sections + mobile pill row).
- [x] **Sequential test suite** — 8 phase files in
      [apps/web/src/**sequential**/](../../apps/web/src/__sequential__/),
      32 tests total covering tokens, marketing, auth, app shell,
      workspace/dashboard, first-run journey, venture flow, reports/credits.
- [x] **Bugs found by the suite**
  - `TenantProvider` initial `loading` flag was `false` — racing the
    `AppLayout` redirect-on-empty-tenants check on hard reload. Now `true`.
  - Hono's `app.use('*', errorBoundaryMiddleware)` could never run its catch
    block — its compose() catches handler throws first and routes them to
    `app.onError` (the default = console.error + 500 text). Moved the logic
    into `app.onError(onErrorHandler)`. Every API error now returns proper
    RFC7807 problem+json instead of plain "Internal Server Error".
  - `sendTracked` (api email pipeline) was silently swallowing errors with
    no log. Now logs `magic-link request failed (silent)` at warn level so
    "no email arrived" mysteries surface in the API console immediately.
  - `pnpm dev` didn't auto-load `.env`. Added `apps/api/src/env-bootstrap.ts`
    - `apps/workers/src/env-bootstrap.ts` that hydrate `process.env` from
      repo-root `.env` (and `.env.${NODE_ENV}` / `.env.local`) at module load.
      Existing env wins so CI and explicit shell vars still take precedence.
  - Husky pre-commit hook called `pnpm` directly, which fails in GUI git
    clients (GitHub Desktop) that ship a minimal PATH. Now falls back to
    `corepack pnpm exec lint-staged`. Also hoisted `eslint` to root devDeps
    so lint-staged finds it from `node_modules/.bin`.
  - drizzle-kit 0.29 (and the 0.30 we bumped to) couldn't resolve `.js`
    import specifiers from `.ts` source. Workaround: point `schema` at the
    compiled `dist/schema/index.js` (added `pnpm --filter @ilinga/db build`
    as a one-shot before `pnpm db:generate`).
  - Migration `0000_init.sql` was just the `vector` extension stub; the real
    table migration was generated and applied to Cockroach Cloud which now
    has 67 tables.

## Skills you'll want for further refinement

- `docs/designs/onboarding.jsx` has a 6-step venture wizard with right-rail
  agent inference. The current `VentureNew` is a single-page form; if you
  want the wizard, port the step machine + `InferRow` derivative panel and
  swap the form out behind a feature flag.
- `docs/designs/auth.jsx` has a `ForgotPassword` 4-step flow (email → otp →
  reset → done) with a live password-strength meter. Not yet ported.
- The synthesis design has a 24-cell "module fanout" grid alongside the
  prompt template + key resolution panels. The current rewrite shows the
  pipeline strip + stages graph + agent stream; the 24-cell grid is still on
  the design floor.
- The interview design has `long`/`choice`/`matrix` answer types. The API
  exposes only free-text answers right now, so the rewrite renders a
  `<Textarea>`. When the schema gains an `inputType: 'choice'`/`'matrix'`
  variant, port the radio-card and 1-5 matrix from
  `docs/designs/view-interview.jsx`.

## Test invariants

`pnpm test` must stay green after every commit. The web sequential suite
uses `@testing-library/react` + jsdom. The standard wrapper is:

```tsx
<ToastProvider>
  <AuthProvider>
    <TenantProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{...}</Routes>
      </MemoryRouter>
    </TenantProvider>
  </AuthProvider>
</ToastProvider>
```

Mock `api.get` / `api.post` / `api.patch` / `api.put` via
`vi.spyOn(apiModule.api, ...)` — see
[`apps/web/src/__sequential__/06-end-to-end-journey.test.tsx`](../../apps/web/src/__sequential__/06-end-to-end-journey.test.tsx)
for the canonical install pattern.
