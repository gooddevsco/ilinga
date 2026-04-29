# Contributing

Branch: `claude/ilinga-saas-platform-ffsjc`. Conventional Commits.

## Hard rules

1. **No dead UI.** No `onClick={() => {}}`, no `href="#"`, no `javascript:`
   URLs, no buttons that toast "coming soon". Wire it, route it, or hide it
   behind a feature flag. Enforced by `pnpm e2e:no-dead-ui` and the
   `ilinga/no-empty-handlers` lint rule. See §35.1 of the implementation plan.
2. **Empty / loading / error / read-only states for every async list and
   detail page** — not optional.
3. **TypeScript strict, no `any`** without a comment justifying it.
4. **Every shipped route** must pass: lint + types + unit + integration + e2e
   + no-dead-ui crawl + axe-core a11y + Lighthouse perf budget.

## Phase Definition of Done

See `docs/IMPLEMENTATION_PLAN.md` §37. Each phase ends with a checkpoint
commit + push.
