import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sheet } from '@ilinga/ui';
import { useAuth } from '../lib/auth';
import { useTenant } from '../lib/tenant';
import { useMaintenance } from '../lib/maintenance';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ventures', label: 'Ventures' },
  { to: '/reports', label: 'Reports' },
];

const isPortalHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.host;
  return host.startsWith('portal.') || host.includes('.portal.');
};

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }): JSX.Element => {
  const { current } = useTenant();
  return (
    <div className="flex h-full flex-col p-4">
      <Link to="/dashboard" className="mb-4 block text-lg font-semibold">
        {current?.displayName ?? 'Workspace'}
      </Link>
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
      <p className="mt-auto pt-4 text-xs text-[color:var(--color-fg-subtle)]">
        Portal access · Settings unavailable
      </p>
    </div>
  );
};

export const PortalLayout = (): JSX.Element => {
  const { user, signOut, loading } = useAuth();
  const { current, loading: tenantsLoading } = useTenant();
  const navigate = useNavigate();
  const maintenance = useMaintenance();
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
  if (!current) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">No workspace</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          The portal address you used isn&apos;t bound to a workspace yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" data-portal-mode={isPortalHost() ? 'on' : 'off'}>
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
            <span className="text-sm text-[color:var(--color-fg-muted)]">Portal</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="ml-auto text-sm text-[color:var(--color-fg-muted)]"
            >
              Sign out
            </button>
          </header>
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export const useIsPortal = (): boolean => isPortalHost();
