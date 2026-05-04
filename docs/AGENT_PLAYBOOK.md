# Agent playbook (self-driving workflow)

This is the protocol for any agent (you, future-you, or another agent)
working on this repo. Follow it without being asked.

## Session start

1. **Read `docs/STATE.md` first.** That file is the source of truth for
   what works, what's stubbed, and what's missing. Don't trust the
   `COMPLETION_CHECKLIST.md` — that's a downstream summary; STATE.md drives.
2. **Read `docs/DOD.md`.** That's what "done" means here. If you can't
   verify all of it, the work isn't done.
3. **Pick the next slice from "Next up" in STATE.md.** Don't ask the user
   "what should I do next?" — that's what the file is for.

## While working

1. **One slice = one commit.** A slice is one row in STATE.md flipping to
   a higher status, plus the code that justifies the flip.
2. **Don't widen scope.** If you discover an adjacent gap, add it to
   STATE.md as `missing`/`built-untested` — don't fix it in this commit.
3. **Pre-commit checklist (run before every commit):**
   - `pnpm -r typecheck` is green.
   - `pnpm -r test` is green (or you have a documented justification).
   - For UI changes: dev server boots; clicked through the new path.
   - For infra: the manual smoke step in DOD.md ran.
4. **STATE.md updates land in the same commit** as the code change.
   Without it, the row is lying.

## When you hit a blocker

1. **Don't stall.** A missing API key, missing infra, or external
   dependency you can't satisfy means: write the code so it's correct
   when the dependency is present, document the blocker in STATE.md's
   Notes column, leave the row `built-untested`, and move to the next
   row.
2. **Don't fake it.** Stubs are fine when they're labelled as stubs in
   STATE.md. They're not fine when they're claimed as `done`.
3. **Surface real ambiguity to the user.** If a decision touches money,
   security, or scope, ask. Otherwise, decide and document.

## Communication

1. **Never ask "should I continue?".** Continue. Stop only when:
   - All P0 rows are `done`.
   - You hit a blocker that can't be worked around (then state it once
     and stop).
   - The user redirects you.
2. **Status updates are one paragraph max.** What flipped, what's next,
   any blocker. No headers, no lists, no celebration.
3. **End-of-turn summary**: rows flipped + commit hash + what's next. One
   sentence each.

## Anti-patterns observed in this repo's history (don't repeat)

1. **Optimistic ticking.** I (the previous agent) ticked
   `COMPLETION_CHECKLIST.md` boxes for code that typechecked but had
   never been exercised against real infra. STATE.md's `built-untested`
   bucket is the fix — use it honestly.
2. **Scope drift on questions.** When the user asked "any gaps?" I'd
   list 30 things and wait. Pick the top one and go; report when it's
   done.
3. **Re-discovering known gaps.** STATE.md exists so you don't have to
   re-audit at the start of every session. If a gap isn't in it, add it
   when you find it; don't treat it as a fresh discovery each time.
4. **Treating user prompts as task starts.** If STATE.md has unfinished
   P0 work, that's the task. The user's message is supplementary info.

## Slice template

For each slice, the commit message is:

```
<area>: <one-line summary that flips a STATE.md row>

- Row(s) flipped in STATE.md: <area> · <row name> → <new status>
- Verification: <one-sentence proof — test ran, smoke ran, observed in dev>
- Blockers (if any): <doc reference>

<longer body if useful, kept under 60 lines>
```

## Push cadence

Push after every slice. Don't batch 5 commits; the loss of intermediate
state if a session dies isn't worth the tidiness.

## When STATE.md disagrees with reality

Reality wins. Update STATE.md.
