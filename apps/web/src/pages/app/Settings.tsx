import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/team', label: 'Team' },
  { to: '/settings/billing', label: 'Billing' },
  { to: '/settings/ai', label: 'AI endpoints' },
  { to: '/settings/security', label: 'Security' },
  { to: '/settings/privacy', label: 'Privacy' },
];

export const SettingsLayout = (): JSX.Element => (
  <div className="space-y-6">
    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
    <div className="flex gap-6 border-b border-[color:var(--color-border)] text-sm">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `border-b-2 pb-3 ${isActive ? 'border-[color:var(--color-fg)]' : 'border-transparent text-[color:var(--color-fg-muted)]'}`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
    <Outlet />
  </div>
);

export const SettingsProfile = (): JSX.Element => (
  <section>
    <h2 className="text-lg font-semibold">Profile</h2>
    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
      Editable profile fields land in Phase 5.
    </p>
  </section>
);

export const SettingsTeam = (): JSX.Element => (
  <section>
    <h2 className="text-lg font-semibold">Team</h2>
    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
      Invite, suspend, and manage seats. Lands in Phase 5.
    </p>
  </section>
);

export const SettingsBilling = (): JSX.Element => (
  <section>
    <h2 className="text-lg font-semibold">Billing</h2>
    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
      Plan, payment method, invoices, auto top-up. Lands in Phase 9.
    </p>
  </section>
);

export const SettingsAi = (): JSX.Element => (
  <section>
    <h2 className="text-lg font-semibold">AI endpoints</h2>
    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
      Bring your own keys for OpenAI, Anthropic, Mistral, and others. Lands in Phase 7.
    </p>
  </section>
);

export const SettingsSecurity = (): JSX.Element => (
  <section>
    <h2 className="text-lg font-semibold">Security</h2>
    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
      Sessions, trusted devices, audit log. Wired in Phase 12.
    </p>
  </section>
);

export const SettingsPrivacy = (): JSX.Element => (
  <section>
    <h2 className="text-lg font-semibold">Privacy</h2>
    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
      Export, rectify, or delete your data. Wired in Phase 12.
    </p>
  </section>
);
