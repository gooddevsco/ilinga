import { Link } from 'react-router-dom';
import { EmptyState } from '@ilinga/ui';

export const Ventures = (): JSX.Element => (
  <div className="space-y-4">
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">Ventures</h1>
      <Link
        to="/ventures/new"
        className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
      >
        New venture
      </Link>
    </header>
    <EmptyState
      title="Your first venture is one step away"
      body="A venture is a thesis you want to test. Add a brief, run an interview, render a report."
      cta={
        <Link
          to="/ventures/new"
          className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
        >
          Create venture
        </Link>
      }
    />
  </div>
);
