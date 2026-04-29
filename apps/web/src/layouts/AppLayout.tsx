import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMaintenance } from '../lib/maintenance';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ventures', label: 'Ventures' },
  { to: '/reports', label: 'Reports' },
  { to: '/credits', label: 'Credits' },
  { to: '/settings', label: 'Settings' },
];

export const AppLayout = (): JSX.Element => {
  const { user, signOut, loading } = useAuth();
  const maintenance = useMaintenance();
  const navigate = useNavigate();

  if (loading) {
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

  return (
    <div className="flex min-h-screen flex-col">
      {maintenance.active && (
        <div
          role="status"
          className="bg-[color:var(--color-warning)]/10 px-4 py-2 text-center text-sm text-[color:var(--color-warning)]"
        >
          {maintenance.message}
        </div>
      )}
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4 md:block">
          <Link to="/dashboard" className="mb-6 block text-lg font-semibold">
            Ilinga
          </Link>
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] px-6 py-3">
            <span className="text-sm text-[color:var(--color-fg-muted)]">
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
          <main className="flex-1 px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
