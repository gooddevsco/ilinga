import { Link } from 'react-router-dom';

interface Props {
  code: number;
  title: string;
  body: string;
}

const Shell = ({ code, title, body }: Props): JSX.Element => (
  <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 text-center">
    <span className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
      Error {code}
    </span>
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    <p className="text-sm text-[color:var(--color-fg-muted)]">{body}</p>
    <div className="mt-4 flex gap-3">
      <Link
        to="/"
        className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] px-4 text-sm"
      >
        Back home
      </Link>
      <Link
        to="/help/contact"
        className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
      >
        Contact support
      </Link>
    </div>
  </div>
);

export const NotFoundPage = (): JSX.Element => (
  <div data-testid="not-found">
    <Shell code={404} title="Page not found" body="That route doesn’t exist or has moved." />
  </div>
);

export const ForbiddenPage = (): JSX.Element => (
  <Shell code={403} title="Forbidden" body="You don’t have access to this resource." />
);

export const ServerErrorPage = (): JSX.Element => (
  <Shell
    code={500}
    title="Something went wrong"
    body="We hit an unexpected error and have been notified. Try again in a moment."
  />
);

export const RateLimitedPage = (): JSX.Element => (
  <Shell
    code={429}
    title="Too many requests"
    body="You’re going faster than our limits allow. Please slow down and try again shortly."
  />
);

export const MaintenancePage = (): JSX.Element => (
  <Shell
    code={503}
    title="We’re carrying out maintenance"
    body="The platform is briefly unavailable while we ship an upgrade. We’ll be back soon."
  />
);

export const OfflinePage = (): JSX.Element => (
  <Shell
    code={0}
    title="You’re offline"
    body="We couldn’t reach Ilinga. Check your connection and try again."
  />
);

export const ReadOnlyPage = (): JSX.Element => (
  <Shell
    code={402}
    title="Workspace is read-only"
    body="Your subscription needs attention before you can make changes again."
  />
);
