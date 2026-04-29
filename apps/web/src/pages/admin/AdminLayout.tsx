import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/dsar', label: 'DSAR queue' },
  { to: '/admin/maintenance', label: 'Maintenance' },
  { to: '/admin/impersonate', label: 'Impersonate' },
];

export const AdminLayout = (): JSX.Element => (
  <div className="space-y-6">
    <h1 className="text-2xl font-semibold tracking-tight">Platform admin</h1>
    <p className="text-sm text-[color:var(--color-fg-muted)]">
      Restricted to platform admins. Every action is double-actor audit-logged.
    </p>
    <div className="flex flex-wrap gap-6 border-b border-[color:var(--color-border)] text-sm">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `pb-3 ${isActive ? 'border-b-2 border-[color:var(--color-fg)]' : 'text-[color:var(--color-fg-muted)]'}`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
    <Outlet />
  </div>
);
