import { Link } from 'react-router-dom';

export const Home = (): JSX.Element => (
  <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
    <div>
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        Synthesise venture cycles, not slide decks.
      </h1>
      <p className="mt-4 max-w-xl text-base text-[color:var(--color-fg-muted)] md:text-lg">
        Structured interview, AI-driven content keys, board-ready reports, and stakeholder
        feedback — closed-loop, in one workspace.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/sign-up"
          className="inline-flex h-11 items-center rounded-md bg-[color:var(--color-accent)] px-5 text-[color:var(--color-accent-fg)]"
        >
          Start free
        </Link>
        <Link
          to="/pricing"
          className="inline-flex h-11 items-center rounded-md border border-[color:var(--color-border)] px-5"
        >
          See pricing
        </Link>
      </div>
      <ul className="mt-10 grid grid-cols-3 gap-4 text-xs text-[color:var(--color-fg-muted)]">
        <li className="rounded-md border border-[color:var(--color-border)] px-3 py-2">
          GDPR · EU-only data
        </li>
        <li className="rounded-md border border-[color:var(--color-border)] px-3 py-2">
          BYO AI keys
        </li>
        <li className="rounded-md border border-[color:var(--color-border)] px-3 py-2">
          Audit-logged
        </li>
      </ul>
    </div>
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 text-sm text-[color:var(--color-fg-muted)]">
      <p>
        “Ilinga turned three weeks of investor prep into one afternoon. The interview drives the
        synthesis, and the report writes itself from the keys.”
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide">— Founder, seeded SaaS</p>
    </div>
  </section>
);
