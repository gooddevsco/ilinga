import { Link } from 'react-router-dom';

export const Help = (): JSX.Element => (
  <div>
    <h1 className="text-3xl font-semibold tracking-tight">Help & docs</h1>
    <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-fg-muted)]">
      Glossary, how-tos, and answers to common questions. Can&apos;t find what you need?
      <Link to="/help/contact" className="ml-1 underline">
        Contact support
      </Link>
      .
    </p>
    <ul className="mt-8 grid gap-3 md:grid-cols-2">
      {[
        { to: '/help/getting-started', label: 'Getting started' },
        { to: '/help/glossary', label: 'Glossary (cluster, module, key, credit)' },
        { to: '/help/billing', label: 'Billing & credits' },
        { to: '/help/security', label: 'Security & data handling' },
        { to: '/help/api', label: 'API + webhooks' },
        { to: '/help/contact', label: 'Contact support' },
      ].map((item) => (
        <li
          key={item.to}
          className="rounded-md border border-[color:var(--color-border)] px-4 py-3"
        >
          <Link to={item.to} className="text-sm font-medium">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
