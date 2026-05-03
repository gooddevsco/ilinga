import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sheet } from '@ilinga/ui';
import { useAuth } from '../lib/auth';
import { useMaintenance } from '../lib/maintenance';
import { useTenant } from '../lib/tenant';
import { BugReportWidget } from '../features/bug-report/BugReportWidget';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ventures', label: 'Ventures' },
  { to: '/reports', label: 'Reports' },
  { to: '/credits', label: 'Credits' },
  { to: '/trash', label: 'Trash' },
  { to: '/settings', label: 'Settings' },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }): JSX.Element => {
  const { tenants, current, setCurrent } = useTenant();
  return (
    <div className="flex h-full flex-col p-4">
      <Link to="/dashboard" className="mb-4 block text-lg font-semibold">
        Ilinga
      </Link>
      {tenants.length > 1 && current && (
        <select
          value={current.id}
          onChange={(e) => {
            const t = tenants.find((x) => x.id === e.target.value);
            if (t) setCurrent(t);
          }}
          className="mb-4 h-9 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 text-sm"
          aria-label="Switch workspace"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.displayName}
            </option>
          ))}
        </select>
      )}
      <nav className="flex flex-col gap-1 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 ${
                isActive
                  ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]'
                  : 'text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-accent-soft)] hover:text-[color:var(--color-fg)]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 text-xs text-[color:var(--color-fg-subtle)]">
        {current ? <>Workspace: {current.displayName}</> : <>No workspace yet</>}
      </div>
    </div>
  );
};

export const AppLayout = (): JSX.Element => {
  const { user, signOut, loading } = useAuth();
  const { tenants, current, loading: tenantsLoading } = useTenant();
  const maintenance = useMaintenance();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading || tenantsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--color-fg-muted)]">
        Loading…
      </div>
    );
  }
  if (!user) {
    navigate('/sign-in', { replace: true });
    return <div />;
  }
  if (tenants.length === 0 || !current) {
    navigate('/onboarding/create-workspace', { replace: true });
    return <div />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {maintenance.active && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[color:var(--color-warning)]/10 px-4 py-2 text-center text-sm text-[color:var(--color-warning)]"
        >
          {maintenance.message}
        </div>
      )}
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] md:block">
          <Sidebar />
        </aside>
        <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} ariaLabel="Main navigation">
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-3 md:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex size-9 items-center justify-center rounded-md border border-[color:var(--color-border)] md:hidden"
              aria-label="Open navigation"
            >
              <span aria-hidden="true">☰</span>
            </button>
            <Link to="/dashboard" className="text-base font-semibold md:hidden">
              Ilinga
            </Link>
            <span className="hidden text-sm text-[color:var(--color-fg-muted)] md:inline">
              Signed in as {user.userId.slice(0, 8)}…
            </span>
            <Link to="/help" className="ml-auto text-sm text-[color:var(--color-fg-muted)]">
              Help
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
            >
              Sign out
            </button>
          </header>
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
      <BugReportWidget />
    </div>
  );
};
