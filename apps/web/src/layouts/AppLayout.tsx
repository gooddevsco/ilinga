import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Eyebrow, IconLogo, Icons, Kbd, ProgressBar, cn, type IconName } from '@ilinga/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useMaintenance } from '../lib/maintenance';
import { useTenant, type TenantSummary } from '../lib/tenant';
import { BugReportWidget } from '../features/bug-report/BugReportWidget';

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  /** Match any path that startsWith this prefix in addition to exact match. */
  matchPrefix?: string;
}

const workspaceNav: NavEntry[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'chart' },
  { to: '/ventures', label: 'Ventures', icon: 'cycle', matchPrefix: '/ventures' },
  { to: '/reports', label: 'Reports', icon: 'doc', matchPrefix: '/reports' },
];

const accountNav: NavEntry[] = [
  { to: '/credits', label: 'Credits & billing', icon: 'credits' },
  { to: '/trash', label: 'Trash', icon: 'x' },
  { to: '/settings', label: 'Settings', icon: 'settings', matchPrefix: '/settings' },
];

const titleFor = (pathname: string): string => {
  if (pathname.startsWith('/ventures/new')) return 'New venture';
  if (pathname.startsWith('/ventures/')) {
    if (pathname.includes('/interview')) return 'Interview';
    if (pathname.includes('/synthesis')) return 'Synthesis pipeline';
    if (pathname.includes('/keys')) return 'Module outputs';
    if (pathname.includes('/reports')) return 'Cycle reports';
    return 'Venture';
  }
  if (pathname === '/ventures') return 'Ventures';
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/reports') return 'Reports';
  if (pathname.startsWith('/reports/')) return 'Report';
  if (pathname === '/credits') return 'Credits & billing';
  if (pathname === '/trash') return 'Trash';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname === '/workspaces/new') return 'New workspace';
  return 'Ilinga';
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'IL';

const Brand = ({ onClose }: { onClose?: () => void }): JSX.Element => (
  <div className="flex items-center gap-2.5 px-3.5 pt-4 pb-2">
    <span style={{ color: 'var(--signal)' }}>
      <IconLogo size={18} />
    </span>
    <span className="text-[14px] font-semibold tracking-tight">Ilinga</span>
    {onClose && (
      <button
        type="button"
        className="btn sm ghost ml-auto"
        style={{ padding: '2px 6px', height: 22 }}
        onClick={onClose}
        aria-label="Close menu"
      >
        <Icons.x />
      </button>
    )}
  </div>
);

const WorkspacePill = ({
  current,
  tenants,
  onSwitch,
}: {
  current: TenantSummary | null;
  tenants: TenantSummary[];
  onSwitch(t: TenantSummary): void;
}): JSX.Element => {
  const [open, setOpen] = useState(false);
  const close = (): void => setOpen(false);

  if (!current) {
    return (
      <Link
        to="/workspaces/new"
        className="mx-3 mt-2.5 mb-1.5 flex items-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] px-2.5 py-2 text-[12px]"
      >
        <span className="grid size-7 place-items-center rounded-md bg-[color:var(--paper-2)] text-[11px] text-[color:var(--ink-mute)]">
          <Icons.plus />
        </span>
        <span className="font-medium">Create workspace</span>
      </Link>
    );
  }

  return (
    <div className="relative mx-3 mt-2.5 mb-1.5">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] px-2.5 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className="grid size-7 place-items-center rounded-md text-[12px] font-semibold"
          style={{ background: 'var(--signal)', color: 'var(--signal-ink)' }}
        >
          {initials(current.displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium">{current.displayName}</div>
          <div className="mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--ink-faint)]">
            {current.role.toUpperCase()}
          </div>
        </div>
        <span className="text-[color:var(--ink-faint)]">
          <Icons.more />
        </span>
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] py-1"
          onMouseLeave={close}
          role="menu"
        >
          {tenants.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px]',
                t.id === current.id
                  ? 'bg-[color:var(--paper-1)] font-medium'
                  : 'hover:bg-[color:var(--paper-1)]',
              )}
              onClick={() => {
                onSwitch(t);
                close();
              }}
            >
              <span
                className="grid size-5 place-items-center rounded-sm text-[10px] font-semibold"
                style={{ background: 'var(--signal-soft)', color: 'var(--signal)' }}
              >
                {initials(t.displayName)}
              </span>
              <span className="truncate">{t.displayName}</span>
            </button>
          ))}
          <div className="my-1 h-px bg-[color:var(--line)]" />
          <Link
            to="/workspaces/new"
            role="menuitem"
            className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-[color:var(--ink-mute)] hover:bg-[color:var(--paper-1)] hover:text-[color:var(--ink)]"
            onClick={close}
          >
            <Icons.plus />
            New workspace
          </Link>
        </div>
      )}
    </div>
  );
};

const NavList = ({
  items,
  section,
  onPick,
}: {
  items: NavEntry[];
  section: string;
  onPick?(): void;
}): JSX.Element => (
  <div>
    <div className="nav-section">{section}</div>
    {items.map((item) => {
      const Glyph = Icons[item.icon];
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={!item.matchPrefix}
          className={({ isActive }) => cn('nav-item', isActive && 'active')}
          onClick={onPick}
        >
          <span className="ico" aria-hidden="true">
            <Glyph />
          </span>
          {item.label}
        </NavLink>
      );
    })}
  </div>
);

const CreditsBox = ({
  balance,
  cap,
  onTopUp,
}: {
  balance: number | null;
  cap: number;
  onTopUp(): void;
}): JSX.Element => {
  const pct = balance == null ? 0 : Math.min(100, Math.max(0, (balance / cap) * 100));
  return (
    <div className="border-t border-[color:var(--line)] p-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <Eyebrow>Credits</Eyebrow>
        <span className="mono text-[13px]">
          <span style={{ color: 'var(--signal)' }}>{balance ?? '—'}</span>
          <span className="text-[color:var(--ink-faint)]"> / {cap}</span>
        </span>
      </div>
      <ProgressBar value={pct} ariaLabel="Credit balance" />
      <button type="button" className="btn sm mt-2.5 w-full" onClick={onTopUp}>
        Top up
      </button>
    </div>
  );
};

const Topbar = ({
  title,
  workspaceName,
  user,
  onMenu,
  onSignOut,
}: {
  title: string;
  workspaceName: string | null;
  user: { userId: string };
  onMenu(): void;
  onSignOut(): void;
}): JSX.Element => (
  <header className="flex items-center gap-3 border-b border-[color:var(--line)] bg-[color:var(--bg)] px-4 py-3 md:px-5">
    <button
      type="button"
      className="btn sm r-mobile-only"
      style={{ padding: '4px 8px' }}
      onClick={onMenu}
      aria-label="Open navigation"
    >
      <Icons.menu />
    </button>
    <span className="mono r-mobile-hide text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
      {workspaceName ? `${workspaceName} /` : 'ILINGA /'}
    </span>
    <span className="text-[14px] font-medium">{title}</span>
    <div className="flex-1" />
    <div className="r-mobile-hide hidden items-center gap-2.5 rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] px-3 py-1.5 md:flex md:min-w-[260px]">
      <span className="text-[color:var(--ink-faint)]">
        <Icons.search />
      </span>
      <span className="text-[13px] text-[color:var(--ink-faint)]">Search modules, reports…</span>
      <span className="flex-1" />
      <Kbd>⌘ K</Kbd>
    </div>
    <Link to="/help" className="btn sm r-mobile-hide" aria-label="Help">
      <Icons.bell />
    </Link>
    <button type="button" className="btn sm" onClick={onSignOut} aria-label="Sign out">
      <Icons.user />
      <span className="r-mobile-hide">{user.userId.slice(0, 6)}…</span>
    </button>
  </header>
);

const Sidebar = ({
  current,
  tenants,
  onSwitch,
  balance,
  cap,
  onTopUp,
  onPick,
  withCloseButton,
}: {
  current: TenantSummary | null;
  tenants: TenantSummary[];
  onSwitch(t: TenantSummary): void;
  balance: number | null;
  cap: number;
  onTopUp(): void;
  onPick?(): void;
  withCloseButton?: { onClose(): void };
}): JSX.Element => (
  <div className="flex h-full flex-col">
    <Brand onClose={withCloseButton?.onClose} />
    <WorkspacePill current={current} tenants={tenants} onSwitch={onSwitch} />
    <div className="flex-1 overflow-auto px-3 pb-2">
      <NavList items={workspaceNav} section="Workspace" onPick={onPick} />
      <NavList items={accountNav} section="Account" onPick={onPick} />
    </div>
    <CreditsBox balance={balance} cap={cap} onTopUp={onTopUp} />
  </div>
);

const useCreditBalance = (
  tenantId: string | undefined,
): { balance: number | null; cap: number; refresh(): void } => {
  const [balance, setBalance] = useState<number | null>(null);
  const cap = 500; // visual ceiling for the bar; adjusted once plan endpoint exposes it

  const refresh = useMemo(
    () => () => {
      if (!tenantId) {
        setBalance(null);
        return;
      }
      api
        .get<{ balance: number }>(`/v1/billing/tenant/${tenantId}/balance`)
        .then((r) => setBalance(r.balance))
        .catch(() => setBalance(null));
    },
    [tenantId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, cap, refresh };
};

const Frame = ({
  banner,
  sidebar,
  topbar,
  drawer,
  children,
}: {
  banner: ReactNode;
  sidebar: ReactNode;
  topbar: ReactNode;
  drawer: ReactNode;
  children: ReactNode;
}): JSX.Element => (
  <div className="flex min-h-screen flex-col">
    {banner}
    <div
      className="r-app-shell flex-1"
      style={{ display: 'grid', gridTemplateColumns: '244px 1fr', minHeight: 0 }}
    >
      <aside className="r-sidebar flex flex-col border-r border-[color:var(--line)] bg-[color:var(--bg)]">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-col">
        {topbar}
        <main className="flex-1 overflow-auto px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
      {drawer}
    </div>
  </div>
);

export const AppLayout = (): JSX.Element => {
  const { user, signOut, loading } = useAuth();
  const maintenance = useMaintenance();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenants, current, setCurrent, loading: tenantsLoading } = useTenant();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { balance, cap } = useCreditBalance(current?.id);

  // First-run: signed-in users with no workspace land on the create page.
  useEffect(() => {
    if (loading || tenantsLoading || !user) return;
    if (tenants.length === 0 && location.pathname !== '/workspaces/new') {
      navigate('/workspaces/new', { replace: true });
    }
  }, [loading, tenantsLoading, user, tenants.length, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--ink-mute)]">
        <span className="spinner mr-2" /> Loading…
      </div>
    );
  }
  if (!user) {
    navigate('/sign-in', { replace: true });
    return <div />;
  }

  const banner = maintenance.active ? (
    <div
      role="status"
      aria-live="polite"
      className="bg-[color:var(--ochre-soft)] px-4 py-2 text-center text-[13px] text-[color:var(--ink)]"
    >
      {maintenance.message}
    </div>
  ) : null;

  const closeDrawer = (): void => setDrawerOpen(false);
  const openDrawer = (): void => setDrawerOpen(true);
  const goTopUp = (): void => {
    closeDrawer();
    navigate('/credits');
  };

  const sidebar = (
    <Sidebar
      current={current}
      tenants={tenants}
      onSwitch={setCurrent}
      balance={balance}
      cap={cap}
      onTopUp={goTopUp}
    />
  );
  const topbar = (
    <Topbar
      title={titleFor(location.pathname)}
      workspaceName={current?.displayName ?? null}
      user={user}
      onMenu={openDrawer}
      onSignOut={() => void signOut()}
    />
  );
  const drawer = (
    <>
      <div
        className={cn('r-drawer-mask', drawerOpen && 'open')}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside className={cn('r-drawer-panel', drawerOpen && 'open')}>
        <Sidebar
          current={current}
          tenants={tenants}
          onSwitch={(t) => {
            setCurrent(t);
            closeDrawer();
          }}
          balance={balance}
          cap={cap}
          onTopUp={goTopUp}
          onPick={closeDrawer}
          withCloseButton={{ onClose: closeDrawer }}
        />
      </aside>
    </>
  );

  return (
    <Frame banner={banner} sidebar={sidebar} topbar={topbar} drawer={drawer}>
      <Outlet />
      <BugReportWidget />
    </Frame>
  );
};
