import { Link } from 'react-router-dom';
import { EmptyState } from '@ilinga/ui';

export const Reports = (): JSX.Element => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
    <EmptyState
      title="No reports yet"
      body="Reports are generated from a venture cycle. Render an Investor Pulse for free, or step up to a paid template."
      cta={
        <Link
          to="/ventures"
          className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
        >
          Pick a venture
        </Link>
      }
    />
  </div>
);
