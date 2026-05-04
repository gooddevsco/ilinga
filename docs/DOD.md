# Definition of done

A row in `docs/STATE.md` flips to `done` only when ALL of these hold:

## Code

1. The implementation file(s) listed in the row exist with real
   behaviour. No `// TODO`, no `throw new Error('not implemented')`, no
   string `'[stub]'` in production paths.
2. `pnpm -r typecheck` is green (no `any` casts that hide errors; no
   `// @ts-expect-error` without a real reason).
3. The code matches the area's idioms (zod for inputs, drizzle for
   queries, hono for routes, react 19 / react-router-dom for UI).

## Tests

4. Unit test exists at the same level as the code (next to the file).
5. `pnpm -r test` is green.
6. For features touching the database: an integration test exists under
   `apps/api/src/integration/` and runs green against a real Cockroach
   in a `make dev` shell. (Marked `built-untested` if the test exists
   but hasn't been run against real infra.)
7. For UI: at least one Vitest + RTL test asserts the happy path renders
   the right text + the right action triggers the right XHR.

## Verification (the most-skipped step)

8. **Observed in dev**, not just imagined. For each row:
   - Backend route → curl or HTTPie hits it, returns the expected status
     and body.
   - Worker job → enqueued in dev, observed processing in BullMQ logs,
     observed updating the right table.
   - Email → mailpit at `http://localhost:8025` shows the rendered email
     with the right subject + body + brand.
   - SSE stream → connected an `EventSource` (curl or browser) and
     observed the events arriving.
   - UI flow → opened the page, clicked the button, saw the result.
9. For external integrations (Resend, Postmark, Dodo, n8n, Playwright):
   row goes `built-untested` until exercised against the real provider.
   `done` requires a real round-trip.

## Documentation

10. STATE.md row is flipped to the right status and dated.
11. The acceptance line in STATE.md actually happened. If it didn't,
    rewrite the line to match what's true.
12. If user-facing: `COMPLETION_CHECKLIST.md` echo is updated (still
    downstream of STATE.md, not the other way around).

## Anti-patterns that fail DoD

- "It typechecks, ship it." → not done. See #8.
- "I wrote the test but didn't run it." → not done. See #5.
- "I think Playwright would render this if installed." → not done. See
  #9.
- "The plan says it'll work this way." → not relevant. The acceptance
  criteria has to literally pass.

## Working through built-untested rows

`built-untested` is a holding state for rows where the code is correct
but the dependency isn't satisfiable in the current shell. To clear it:

1. Provision the dependency (start the service, install the binary, get
   the API key).
2. Run the acceptance step from STATE.md.
3. If it passes, flip to `done` and commit.
4. If it fails, the code wasn't correct; debug and fix.

`built-untested` is not a permanent state. If a row sits there for more
than two sessions, escalate: either invest in standing up the dependency
or make the code work without it.
